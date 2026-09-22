// Turns a PDF page's text items into a layout-aware structure so the LLM
// gets a clean, unambiguous table instead of a flat stream of lines.
//
// Two shapes are recognised:
//  - "period grid": header row is period slots ("I(9.00-10.00)", "II(10.00-11.00)", ...),
//    each following row is one class/program with one cell per period column.
//    This is the format college master timetables use — one page, many
//    classes, columns = periods (not days).
//  - anything else: falls back to a left-to-right / top-to-bottom text dump
//    with column gaps preserved (like `pdftotext -layout`), which already
//    works well for ordinary Timings x Days grids.
/* eslint-disable no-console */
const PERIOD_HEADER_RE = /^[IVXLC]+\s*\(\s*\d{1,2}[.:]\d{2}\s*-\s*\d{1,2}[.:]\d{2}\s*\)$/i;
const LINE_GAP = 3; // pts — items within this y-distance are the same visual line

async function getPdfDoc(buffer) {
  // Lazy require: pulls in pdfjs's legacy (Node-friendly) build.
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const data = new Uint8Array(buffer);
  return pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true, isEvalSupported: false }).promise;
}

function clusterByY(items, gap = LINE_GAP) {
  const sorted = [...items].sort((a, b) => b.y - a.y); // PDF y grows upward
  const lines = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.y) <= gap) {
      last.items.push(it);
      last.y = (last.y + it.y) / 2;
    } else {
      lines.push({ y: it.y, items: [it] });
    }
  }
  return lines.map((l) => ({
    y: l.y,
    text: l.items
      .sort((a, b) => a.x - b.x)
      .map((i) => i.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
  }));
}

async function extractPageItems(page) {
  const tc = await page.getTextContent();
  return tc.items
    .map((i) => ({ str: (i.str || '').trim(), x: i.transform[4], y: i.transform[5], w: i.width }))
    .filter((i) => i.str);
}

// Attempt to read the page as a "period grid" master timetable.
function tryPeriodGrid(items) {
  const headers = items.filter((i) => PERIOD_HEADER_RE.test(i.str)).sort((a, b) => a.x - b.x);
  if (headers.length < 3) return null; // not this format

  const headerY = headers[0].y;
  const colStarts = headers.map((h) => h.x);
  const rowLabelBoundary = colStarts[0] - 4; // anything left of period-1 is the row-label column

  // Row labels: leftmost items that sit clearly below the header row.
  const rowLabelItems = items.filter((i) => i.x < rowLabelBoundary && i.y < headerY - LINE_GAP);
  const rowYs = [...new Set(clusterByY(rowLabelItems).map((l) => l.y))].sort((a, b) => b - a);
  if (!rowYs.length) return null;

  // Body items: everything at/under a period column, below the header.
  const bodyItems = items.filter((i) => i.x >= rowLabelBoundary && i.y < headerY - LINE_GAP);

  const bandFor = (y) => {
    let band = rowYs[0];
    for (const ry of rowYs) {
      if (y <= ry + LINE_GAP) band = ry;
    }
    return band;
  };
  const colFor = (x) => {
    let col = 0;
    for (let c = 0; c < colStarts.length; c += 1) if (x >= colStarts[c] - 4) col = c;
    return col;
  };

  const rows = new Map(rowYs.map((y) => [y, { label: '', cols: colStarts.map(() => []) }]));
  clusterByY(rowLabelItems).forEach((l) => {
    const r = rows.get(bandFor(l.y));
    if (r) r.label = [r.label, l.text].filter(Boolean).join(' ');
  });
  bodyItems.forEach((it) => {
    const r = rows.get(bandFor(it.y));
    if (r) r.cols[colFor(it.x)].push(it);
  });

  const lines = ['(Master period-grid timetable — columns are PERIOD SLOTS, not days.)', ''];
  for (const y of rowYs) {
    const row = rows.get(y);
    if (!row.label) continue;
    // A wrapped row-label prints as two label lines close together (e.g. "B.Sc. I(CS" /
    // "Subject)"); the second line owns no column content of its own, so it produces
    // an empty, useless heading here — drop any row band with nothing under it.
    const cells = row.cols
      .map((colItems, c) => ({ header: headers[c].str, lines: clusterByY(colItems).map((l) => l.text).filter(Boolean) }))
      .filter((cell) => cell.lines.length);
    if (!cells.length) continue;
    lines.push(`## CLASS: ${row.label}`);
    cells.forEach((cell) => {
      lines.push(`Period ${cell.header}:`);
      cell.lines.forEach((t) => lines.push(`- ${t}`));
    });
    lines.push('');
  }
  return lines.join('\n');
}

function fallbackLayout(items) {
  return clusterByY(items)
    .map((l) => l.text)
    .filter(Boolean)
    .join('\n');
}

async function pdfToLayoutText(buffer) {
  const doc = await getPdfDoc(buffer);
  const pages = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const items = await extractPageItems(await doc.getPage(p));
    if (!items.length) continue;
    pages.push(tryPeriodGrid(items) || fallbackLayout(items));
  }
  return pages.join('\n\n---\n\n');
}

module.exports = { pdfToLayoutText };
