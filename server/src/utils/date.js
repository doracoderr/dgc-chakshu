const TZ = 'Asia/Kolkata';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function istNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}`;
  return { date, time: `${p.hour}:${p.minute}`, day: dayFromDate(date) };
}

function dayFromDate(date) {
  const js = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sun
  return DAYS[(js + 6) % 7];
}

module.exports = { istNow, dayFromDate, DAYS, DATE_RE, TIME_RE };
