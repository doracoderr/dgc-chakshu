const mongoose = require('mongoose');
const { DAYS, TIME_RE } = require('../utils/date');

const timetableEntrySchema = new mongoose.Schema(
  {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    program: { type: String, required: true, trim: true }, // e.g. "MCA", "MCA I", "B.Tech CSE"
    semester: { type: Number }, // optional — some master sheets only name a program, not a numeric semester
    section: { type: String, default: '', trim: true },
    // optional — a "master"/period-only timetable (one page, many classes, columns
    // are period slots not days) genuinely has no day info until an admin adds it
    day: { type: String, enum: DAYS },
    period: { type: String, default: '' },
    startTime: { type: String, match: TIME_RE }, // 24h "HH:MM"
    endTime: { type: String, match: TIME_RE },
    subject: { type: String, required: true, trim: true },
    subjectCode: { type: String, default: '', trim: true },
    type: { type: String, enum: ['lecture', 'lab', 'tutorial', 'other'], default: 'lecture' },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    facultyName: { type: String, default: '' }, // raw text from the sheet
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    roomLabel: { type: String, default: '' }, // raw text from the sheet
    source: { type: String, enum: ['ai', 'manual'], default: 'manual' },
  },
  { timestamps: true }
);

timetableEntrySchema.index({ departmentId: 1, program: 1, semester: 1, section: 1, day: 1 });
timetableEntrySchema.index({ facultyId: 1, day: 1, startTime: 1 });
timetableEntrySchema.index({ roomId: 1, day: 1, startTime: 1 });

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema);
