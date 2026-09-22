const Program = require('../models/Program');
const crud = require('./crud.factory');
const { istNow } = require('../utils/date');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ?departmentId & ?category & ?status=running|upcoming|completed & ?q
// running = started (or no start date) and not ended (or no end date)
module.exports = crud(Program, {
  populate: [
    { path: 'departmentId', select: 'name code' },
    { path: 'coordinatorId', select: 'name designation' },
    { path: 'roomId', select: 'roomNumber name' },
  ],
  sort: { startDate: 1, title: 1 },
  buildFilter: ({ departmentId, category, status = 'running', q }) => {
    const today = istNow().date;
    const f = {};
    const and = [];
    if (departmentId) f.departmentId = departmentId;
    if (category) f.category = category;
    if (status === 'running') {
      and.push({ $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: today } }] });
      and.push({ $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: today } }] });
    } else if (status === 'upcoming') f.startDate = { $gt: today };
    else if (status === 'completed') f.endDate = { $lt: today };
    if (q) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      and.push({ $or: [{ title: rx }, { description: rx }, { venue: rx }] });
    }
    if (and.length) f.$and = and;
    return f;
  },
});
