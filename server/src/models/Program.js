const mongoose = require('mongoose');
const { DATE_RE } = require('../utils/date');

const programSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['course', 'workshop', 'seminar', 'certificate', 'club', 'placement', 'other'],
      default: 'other',
    },
    description: { type: String, default: '' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    venue: { type: String, default: '' },
    schedule: { type: String, default: '' }, // free text, e.g. "Sat 10:00–13:00"
    startDate: { type: String, match: DATE_RE },
    endDate: { type: String, match: DATE_RE }, // empty = ongoing / no fixed end
    coverImage: { type: String },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

programSchema.index({ departmentId: 1 });
programSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Program', programSchema);
