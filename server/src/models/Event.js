const mongoose = require('mongoose');
const { DATE_RE, TIME_RE } = require('../utils/date');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }, // empty = college-wide
    blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    venue: { type: String, default: '' },
    startDate: { type: String, required: true, match: DATE_RE },
    endDate: { type: String, match: DATE_RE },
    startTime: { type: String, match: TIME_RE },
    endTime: { type: String, match: TIME_RE },
    organizer: { type: String, default: '' },
    coverImage: { type: String },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

eventSchema.pre('validate', function (next) {
  if (!this.endDate) this.endDate = this.startDate;
  if (this.endDate < this.startDate) return next(new Error('endDate cannot be before startDate'));
  next();
});

eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ departmentId: 1 });

module.exports = mongoose.model('Event', eventSchema);
