const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABEL = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

// "14:30" -> "2:30 PM"
export function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// "2026-09-21" -> "21 Sep 2026"
export function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateRange(start, end) {
  if (!start) return '';
  return !end || end === start ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`;
}

export function todayDayCode() {
  const js = new Date().toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' });
  return js.slice(0, 3);
}

export { DAY_ORDER, DAY_LABEL };

export const PROGRAM_CATEGORIES = ['course', 'workshop', 'seminar', 'certificate', 'club', 'placement', 'other'];
