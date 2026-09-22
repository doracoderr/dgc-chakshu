const XLSX = require('xlsx');
const { pdfToLayoutText } = require('./pdfLayout');

// Any spreadsheet-ish workbook (.xlsx, .xls, .csv) -> plain text, sheet by sheet.
function xlsxToText(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  return wb.SheetNames.map((name) => {
    const sheet = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    return `Sheet: ${name}\n${csv}`;
  }).join('\n\n');
}

// PDF -> layout-aware text. Only works for "born-digital" PDFs with selectable
// text; scanned/photographed PDFs have no extractable text and the caller
// should fall back to asking for an image instead.
async function pdfToText(buffer) {
  try {
    return await pdfToLayoutText(buffer);
  } catch {
    return '';
  }
}

// Heuristic: does this look like a real table, or basically nothing (scanned PDF)?
function looksLikeUsableText(text) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length >= 80;
}

module.exports = { xlsxToText, pdfToText, looksLikeUsableText };
