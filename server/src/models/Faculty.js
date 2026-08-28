const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: { type: String },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    photo: { type: String },
    email: { type: String },
    phone: { type: String },
    approvedForDisplay: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);
