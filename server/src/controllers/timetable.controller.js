const TimetableEntry = require('../models/TimetableEntry');
const Faculty = require('../models/Faculty');
const Room = require('../models/Room');
const { extractFromImage, extractFromText } = require('../services/groqTimetable');
const { xlsxToText, pdfToText, looksLikeUsableText } = require('../services/fileToText');
const { DAYS } = require('../utils/date');

const SPREADSHEET_EXT = /\.(xlsx|xls|csv)$/i;
const PDF_EXT = /\.pdf$/i;

// Accepts a data URL ("data:<mime>;base64,....") or a raw base64 string.
function decodeDataUrl(value) {
  const m = String(value || '').match(/^data:([\w/+.-]+);base64,(.*)$/s);
  return m ? { mime: m[1], base64: m[2] } : { mime: undefined, base64: value };
}

const ok = (res, data, message = 'OK', status = 200) => res.status(status).json({ success: true, message, data });
const fail = (res, status, message, code) => res.status(status).json({ success: false, message, error: { code } });
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const TITLES = new Set(['dr', 'prof', 'mr', 'mrs', 'ms', 'miss', 'er', 'sh', 'smt']);
const tokens = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !TITLES.has(t));

function matchFaculty(raw, facultyList) {
  const a = tokens(raw);
  if (!a.length) return null;
  let best = null;
  let bestScore = 0;
  let tie = false;
  for (const f of facultyList) {
    const b = tokens(f.name);
    if (!b.length) continue;
    const hit = a.filter((t) => b.some((u) => u === t || (t.length === 1 && u.startsWith(t)))).length;
    const score = hit / Math.max(a.length, b.length);
    if (score > bestScore) {
      best = f;
      bestScore = score;
      tie = false;
    } else if (score === bestScore && score > 0) {
      tie = true;
    }
  }
  return best && bestScore >= 0.5 && !tie ? best._id : null;
}

function matchRoom(raw, rooms) {
  const key = String(raw || '').toLowerCase().replace(/^(room|rm|r)[\s.\-no]*/i, '').trim();
  if (!key) return null;
  const exact = rooms.filter((r) => String(r.roomNumber || '').toLowerCase() === key);
  if (exact.length === 1) return exact[0]._id;
  const byName = rooms.filter((r) => r.name && r.name.toLowerCase() === key);
  return byName.length === 1 ? byName[0]._id : null;
}

// Step 1: file (image / PDF / Excel) -> draft entries (nothing is saved). Admin reviews/edits, then calls /bulk.
exports.extract = async (req, res, next) => {
  try {
    const { image, file, fileName, mimeType } = req.body;
    const raw = file || image; // "image" kept for backward compatibility
    if (!raw) return fail(res, 400, '"file" (base64 or data URL) is required', 'MISSING_FILE');

    const { mime: detectedMime, base64 } = decodeDataUrl(raw);
    const mime = detectedMime || mimeType || '';
    const name = fileName || '';

    let result;
    if (mime.startsWith('image/') || (!mime && !PDF_EXT.test(name) && !SPREADSHEET_EXT.test(name))) {
      result = await extractFromImage({ imageBase64: base64, mimeType: mime || 'image/jpeg' });
    } else if (mime === 'application/pdf' || PDF_EXT.test(name)) {
      const buffer = Buffer.from(base64, 'base64');
      const text = await pdfToText(buffer);
      if (!looksLikeUsableText(text)) {
        return fail(
          res,
          400,
          'This PDF has no selectable text (looks scanned). Please upload it as an image instead.',
          'SCANNED_PDF'
        );
      }
      result = await extractFromText({ text, sourceLabel: 'PDF' });
    } else if (
      SPREADSHEET_EXT.test(name) ||
      /sheet|excel|csv/i.test(mime)
    ) {
      const buffer = Buffer.from(base64, 'base64');
      const text = xlsxToText(buffer);
      result = await extractFromText({ text, sourceLabel: 'spreadsheet' });
    } else {
      return fail(res, 400, 'Unsupported file type. Upload an image, PDF or Excel/CSV file.', 'UNSUPPORTED_TYPE');
    }

    const [facultyList, rooms] = await Promise.all([
      Faculty.find().select('name').lean(),
      Room.find().select('roomNumber name').lean(),
    ]);

    result.entries = result.entries.map((e) => ({
      ...e,
      facultyId: matchFaculty(e.facultyName, facultyList),
      roomId: matchRoom(e.roomLabel, rooms),
    }));

    ok(res, result, `Extracted ${result.entries.length} entries — review before saving`);
  } catch (err) {
    next(err);
  }
};

// Step 2: save reviewed entries. Each entry carries its own program/semester/section
// (a single upload can cover many classes — a department "master" timetable lists
// several programs on one page). Saving replaces the previously-saved timetable for
// every distinct (department, program, semester, section) group present in this batch,
// leaving every other class's saved timetable untouched.
exports.bulkSave = async (req, res, next) => {
  try {
    const { departmentId, entries, replace = true, source = 'ai' } = req.body;
    if (!departmentId || !Array.isArray(entries) || !entries.length) {
      return fail(res, 400, 'departmentId and non-empty entries are required', 'INVALID_BODY');
    }
    if (entries.some((e) => !e.program || !String(e.program).trim())) {
      return fail(res, 400, 'Every entry needs a program/class name', 'MISSING_PROGRAM');
    }

    const docs = entries.map((e) => ({
      departmentId,
      program: String(e.program).trim(),
      semester: e.semester === '' || e.semester == null ? undefined : Number(e.semester),
      section: (e.section || '').trim(),
      day: e.day || undefined,
      period: e.period,
      startTime: e.startTime || undefined,
      endTime: e.endTime || undefined,
      subject: e.subject,
      subjectCode: e.subjectCode,
      type: e.type,
      facultyId: e.facultyId || undefined,
      facultyName: e.facultyName,
      roomId: e.roomId || undefined,
      roomLabel: e.roomLabel,
      source,
    }));

    // Validate everything first so a bad row never leaves a half-deleted timetable behind.
    await Promise.all(docs.map((d) => new TimetableEntry(d).validate()));

    if (replace) {
      const groupKey = (d) => `${d.program}\u0000${d.semester ?? ''}\u0000${d.section}`;
      const groups = [...new Map(docs.map((d) => [groupKey(d), d])).values()];
      await Promise.all(
        groups.map((g) =>
          TimetableEntry.deleteMany({ departmentId, program: g.program, semester: g.semester, section: g.section })
        )
      );
    }
    const created = await TimetableEntry.insertMany(docs);
    ok(res, { count: created.length }, 'Timetable saved', 201);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { departmentId, program, semester, section, day, facultyId, roomId, q } = req.query;
    const filter = {};
    if (departmentId) filter.departmentId = departmentId;
    if (program) filter.program = new RegExp(`^${escapeRegex(program)}$`, 'i');
    if (semester) filter.semester = Number(semester);
    if (section) filter.section = new RegExp(`^${escapeRegex(section)}$`, 'i');
    if (day) filter.day = day;
    if (facultyId) filter.facultyId = facultyId;
    if (roomId) filter.roomId = roomId;
    if (q) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ subject: rx }, { subjectCode: rx }, { facultyName: rx }, { roomLabel: rx }];
    }

    const rows = await TimetableEntry.find(filter)
      .populate('facultyId', 'name designation')
      .populate('roomId', 'roomNumber name floorNumber blockId')
      .lean();

    const dayRank = (d) => (DAYS.includes(d) ? DAYS.indexOf(d) : DAYS.length); // unscheduled entries sort last
    rows.sort(
      (a, b) =>
        a.program.localeCompare(b.program) ||
        (a.semester || 0) - (b.semester || 0) ||
        a.section.localeCompare(b.section) ||
        dayRank(a.day) - dayRank(b.day) ||
        (a.startTime || '').localeCompare(b.startTime || '')
    );
    ok(res, rows);
  } catch (err) {
    next(err);
  }
};

// Distinct programs/semesters/sections so the UI can build filter dropdowns.
exports.filters = async (req, res, next) => {
  try {
    const groups = await TimetableEntry.aggregate([
      { $group: { _id: { departmentId: '$departmentId', program: '$program', semester: '$semester', section: '$section' } } },
      { $replaceRoot: { newRoot: '$_id' } },
      { $sort: { program: 1, semester: 1, section: 1 } },
    ]);
    ok(res, groups);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    ok(res, await TimetableEntry.create({ ...req.body, source: 'manual' }), 'Entry created', 201);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const row = await TimetableEntry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!row) return fail(res, 404, 'Entry not found', 'NOT_FOUND');
    ok(res, row, 'Entry updated');
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const row = await TimetableEntry.findByIdAndDelete(req.params.id);
    if (!row) return fail(res, 404, 'Entry not found', 'NOT_FOUND');
    ok(res, row, 'Entry deleted');
  } catch (err) {
    next(err);
  }
};
