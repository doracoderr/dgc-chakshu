const Event = require('../models/Event');
const crud = require('./crud.factory');
const { istNow, DATE_RE } = require('../utils/date');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ?departmentId & ?when=ongoing|upcoming|past|today & ?date & ?q
module.exports = crud(Event, {
  populate: [
    { path: 'departmentId', select: 'name code' },
    { path: 'blockId', select: 'name' },
    { path: 'roomId', select: 'roomNumber name' },
  ],
  sort: { startDate: 1, startTime: 1 },
  buildFilter: ({ departmentId, when, date, q }) => {
    const f = {};
    const today = DATE_RE.test(date || '') ? date : istNow().date;
    if (departmentId) f.departmentId = departmentId;
    if (when === 'upcoming') f.startDate = { $gt: today };
    else if (when === 'past') f.endDate = { $lt: today };
    else if (when === 'ongoing' || when === 'today') Object.assign(f, { startDate: { $lte: today }, endDate: { $gte: today } });
    else Object.assign(f, { endDate: { $gte: today } }); // default: not yet finished
    if (q) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      f.$or = [{ title: rx }, { description: rx }, { venue: rx }, { organizer: rx }];
    }
    return f;
  },
});
