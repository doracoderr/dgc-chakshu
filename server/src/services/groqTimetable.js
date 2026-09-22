const { DAYS } = require('../utils/date');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_BASE64_BYTES = 4 * 1024 * 1024; // Groq limit for base64 image requests
const MAX_TEXT_CHARS = 60000; // keep extracted PDF/Excel text well under the model's context

// Compact line format for the vision model: qwen3.8-27b's free/on-demand tier
// caps output at ~1000 tokens/minute. A JSON object repeats every field name
// per entry (~2-2.5x more tokens); plain pipe-separated lines fit a full
// week's timetable comfortably under that budget.
const VISION_SYSTEM_PROMPT = `You extract a class timetable from an image.
Output ONLY plain text lines, nothing else — no JSON, no markdown, no explanation, no header row.

Optional first line (only if you can determine any of it, applies to entries that don't state their own class):
META|<program or empty>|<semester number or empty>|<section or empty>

Then one line per class slot:
ENTRY|<program or empty>|<day or empty>|<period>|<startTime>|<endTime>|<subject>|<subjectCode>|<type>|<faculty>|<room>

Field rules:
- program: which class/group this slot belongs to (e.g. "MCA I", "BCA II(A)"), ONLY if the image lists more than one class/program on the same sheet (a master/consolidated timetable). If the whole image is a single class's timetable, leave this empty (use META instead).
- day: Mon, Tue, Wed, Thu, Fri, Sat or Sun — ONLY if the sheet has explicit day columns/labels. If the sheet only shows period numbers/times with NO day information (a master timetable), leave day EMPTY. Never guess a day.
- period: the period label as printed, or empty if none.
- startTime/endTime: 24-hour HH:MM if the sheet shows clock times, else empty. A cell spanning several periods (labs are usually 2-3) is ONE entry with the full start-end range.
- type: lecture, lab, tutorial or other.
- If one period slot lists more than one class happening in parallel (e.g. different student groups/batches), output one ENTRY line per item — never merge them into one invented subject.
- Leave a field empty (nothing between the pipes) if unreadable or missing — never invent subject, faculty or room text, and never invent a subject that isn't literally on the sheet. Keep faculty/room exactly as written.
- Skip breaks, lunch, empty cells and free periods.
- Keep every line short — no extra commentary anywhere in the output.`;

const TEXT_SYSTEM_PROMPT = `You extract class timetables from text/table data (extracted from a PDF or spreadsheet) into strict JSON.
Return ONLY a JSON object:
{
  "program": string|null,
  "semester": number|null,
  "section": string|null,
  "entries": [
    {
      "program": string|null,
      "day": "Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat"|"Sun"|null,
      "period": string|null,
      "startTime": "HH:MM" 24-hour|null,
      "endTime": "HH:MM" 24-hour|null,
      "subject": string,
      "subjectCode": string|null,
      "type": "lecture"|"lab"|"tutorial"|"other",
      "faculty": string|null,
      "room": string|null
    }
  ]
}

The top-level "program"/"semester"/"section" are DEFAULTS used only for entries that don't specify their own "program".

Two input shapes you may see:

1) A single-class weekly grid (rows or columns are days: Mon..Sat). Every entry belongs to the one class described in the file. Leave entry-level "program" null and set the top-level program/semester/section instead if stated anywhere in the file.

2) A "## CLASS: <name>" master timetable (one page listing MANY classes). Under each "## CLASS: <name>" heading you'll see "Period <label>:" sections, each followed by "- <raw text>" lines. This format has NO day information at all — it is organised by PERIOD SLOT only, valid across the whole week. Rules for this shape:
   - Every entry produced under a "## CLASS: X" heading must have "program": "X" (copy the class heading text exactly).
   - Set "day": null for every entry here — do not guess a day.
   - Set "period" from the "Period <label>:" heading (keep the label as printed, e.g. "I(9.00-10.00)"); derive startTime/endTime from the clock range in that label.
   - Each "- <raw text>" line under a period is its own separate entry (these are often different student batches/groups sharing the same period slot — never merge two "- " lines into one entry, and never split one "- " line into two entries).
   - A "- " line that is just a short trailing fragment with no new subject-like content (e.g. "Floor", continuing the previous line's location) is a wrapped continuation of the "- " line immediately above it — merge it into that entry's room/text instead of creating a new empty entry.
   - Read each raw line's own text ONLY. Do not borrow words from a different line or a different class's line. If a line's subject is genuinely just a room/location/group code with no readable subject name (e.g. only "AEC(5-6)" or "MDC(4-6)"), keep that whole text as-is in "subject" — do not invent a fuller subject name for it.

General rules for every entry:
- A room/location is normally the trailing words after the subject (e.g. "R-44", "IC Conf.", "IC Hall", "APJ III Floor", "IGNOU"). A trailing "(n-m)" right after a subject code (e.g. "OS(4-6)", "AEC(1-2)") is a batch/group or period-span marker, NOT a room and NOT a day — keep it attached to the subject text, don't turn it into a room or a day.
- Do not guess or invent subject, faculty or room text beyond what is literally written. If something is unreadable/absent, use null.
- Skip breaks, lunch, fully empty cells and free periods.
- Keep faculty and room text exactly as written on the sheet.`;

function normalizeTime(v) {
  if (!v) return undefined;
  const m = String(v).trim().toLowerCase().match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)?$/);
  if (!m) return undefined;
  let h = parseInt(m[1], 10);
  const min = m[2];
  if (m[3] === 'pm' && h < 12) h += 12;
  if (m[3] === 'am' && h === 12) h = 0;
  // Timetable sheets without am/pm: 1–6 means afternoon.
  if (!m[3] && h >= 1 && h <= 6) h += 12;
  if (h > 23) return undefined;
  return `${String(h).padStart(2, '0')}:${min}`;
}

function normalizeDay(v) {
  if (!v) return undefined;
  const k = String(v).trim().slice(0, 3).toLowerCase();
  return DAYS.find((d) => d.toLowerCase() === k);
}

function normalizeType(v) {
  const t = String(v || '').toLowerCase();
  return ['lecture', 'lab', 'tutorial'].includes(t) ? t : 'other';
}

// A "Period I(9.00-10.00)" style label -> [start, end] in 24h, if present.
// These sheets print the school day as a continuous run of periods starting
// at 9am with no am/pm marker, so any hour 1-8 appearing after period III or
// so is really 1-8 PM — shift each side of the range independently.
function timesFromPeriodLabel(label) {
  const m = String(label || '').match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/);
  if (!m) return [undefined, undefined];
  const shift = (h) => (h >= 1 && h <= 8 ? h + 12 : h);
  const sh = shift(Number(m[1]));
  const eh = shift(Number(m[3]));
  return [`${String(sh).padStart(2, '0')}:${m[2]}`, `${String(eh).padStart(2, '0')}:${m[4]}`];
}

function shapeEntry(r, defaults) {
  const [pStart, pEnd] = r.startTime || r.endTime ? [undefined, undefined] : timesFromPeriodLabel(r.period);
  return {
    program: (r.program && String(r.program).trim()) || defaults.program || '',
    semester: r.semester != null ? Number(r.semester) || undefined : defaults.semester || undefined,
    section: (r.section && String(r.section).trim()) || defaults.section || '',
    day: normalizeDay(r.day),
    period: r.period ? String(r.period) : '',
    startTime: normalizeTime(r.startTime) || pStart,
    endTime: normalizeTime(r.endTime) || pEnd,
    subject: r.subject ? String(r.subject).trim() : '',
    subjectCode: r.subjectCode ? String(r.subjectCode).trim() : '',
    type: normalizeType(r.type),
    facultyName: r.faculty ? String(r.faculty).trim() : '',
    roomLabel: r.room ? String(r.room).trim() : '',
  };
}

function shapeResult({ program, semester, section, rawEntries }) {
  const defaults = { program: program || '', semester: Number(semester) || undefined, section: section || '' };
  const entries = rawEntries.map((r) => shapeEntry(r, defaults)).filter((r) => r.subject);
  return { program: defaults.program, semester: defaults.semester || null, section: defaults.section, entries };
}

// Parses the compact "META|.." / "ENTRY|.." line format the vision model returns.
function parseLineFormat(raw) {
  let program = '';
  let semester = '';
  let section = '';
  const rawEntries = [];

  for (const line of String(raw || '').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    if (t.toUpperCase().startsWith('META|')) {
      const [, p, s, sec] = t.split('|');
      program = p || program;
      semester = s || semester;
      section = sec || section;
    } else if (t.toUpperCase().startsWith('ENTRY|')) {
      const [, prog, day, period, startTime, endTime, subject, subjectCode, type, faculty, room] = t.split('|');
      rawEntries.push({ program: prog, day, period, startTime, endTime, subject, subjectCode, type, faculty, room });
    }
  }
  return { program, semester, section, rawEntries };
}

async function postGroq(body) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const e = new Error('GROQ_API_KEY not configured on server');
    e.statusCode = 500;
    e.code = 'SERVER_MISCONFIGURED';
    throw e;
  }
  return fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One retry on 429 (rate limit): Groq tells us how long to wait via the
// error body / headers. Free-tier OTPM buckets refill quickly, so a short
// wait usually clears it.
async function callGroq(body) {
  let res = await postGroq(body);
  if (res.status === 429) {
    const retryAfterHeader = res.headers.get('retry-after');
    const waitSec = retryAfterHeader ? Number(retryAfterHeader) : 12;
    await sleep(Math.min(Math.max(waitSec, 3), 30) * 1000);
    res = await postGroq(body);
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    const e = new Error(`Groq API error (${res.status}): ${bodyText.slice(0, 300)}`);
    e.statusCode = res.status === 429 ? 429 : 502;
    e.code = 'GROQ_ERROR';
    throw e;
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || '';
}

// Timetable image (photo/screenshot) -> draft entries. Needs a vision-capable model.
async function extractFromImage({ imageBase64, mimeType = 'image/jpeg' }) {
  if (!imageBase64) {
    const e = new Error('image is required');
    e.statusCode = 400;
    e.code = 'MISSING_IMAGE';
    throw e;
  }
  if (Buffer.byteLength(imageBase64, 'utf8') > MAX_BASE64_BYTES) {
    const e = new Error('Image too large. Compress or crop it to under ~3 MB and retry.');
    e.statusCode = 413;
    e.code = 'IMAGE_TOO_LARGE';
    throw e;
  }

  const content = await callGroq({
    model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b',
    temperature: 0,
    max_completion_tokens: 900, // stay under free-tier OTPM (1000 tok/min) caps
    messages: [
      { role: 'system', content: VISION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract this timetable.' },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
  });

  return shapeResult(parseLineFormat(content));
}

// Timetable already as text (extracted from a PDF or spreadsheet) -> draft entries.
// Plain text-only models work fine here; no vision needed, JSON mode is fine
// since these models don't share the vision model's tight output-token cap.
async function extractFromText({ text, sourceLabel = 'file' }) {
  if (!text || !text.trim()) {
    const e = new Error(`No readable text found in the ${sourceLabel}`);
    e.statusCode = 400;
    e.code = 'EMPTY_TEXT';
    throw e;
  }

  const trimmed = text.slice(0, MAX_TEXT_CHARS);
  const content = await callGroq({
    model: process.env.GROQ_TEXT_MODEL || 'openai/gpt-oss-120b',
    temperature: 0,
    max_completion_tokens: 8192,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: TEXT_SYSTEM_PROMPT },
      { role: 'user', content: `Extract this timetable from the following ${sourceLabel} content:\n\n${trimmed}` },
    ],
  });

  let parsed;
  try {
    parsed = JSON.parse(content || '{}');
  } catch {
    const e = new Error('Model returned invalid JSON. Try a clearer file.');
    e.statusCode = 502;
    e.code = 'BAD_MODEL_OUTPUT';
    throw e;
  }

  return shapeResult({
    program: parsed.program,
    semester: parsed.semester,
    section: parsed.section,
    rawEntries: Array.isArray(parsed.entries) ? parsed.entries : [],
  });
}

module.exports = { extractFromImage, extractFromText };
