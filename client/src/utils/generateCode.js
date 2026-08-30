// Suggests a short uppercase code from a name.
// "Computer Science Engineering" -> "CSE"
// "Library"                       -> "LIBR"
export function generateCodeFromName(name) {
  if (!name || !name.trim()) return '';

  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w));

  if (words.length === 0) return '';

  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }

  return words
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 6);
}
