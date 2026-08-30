const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
    floorNumber: { type: Number, required: true },
    roomNumber: { type: String, required: true },
    name: { type: String },
    type: {
      type: String,
      enum: ['classroom', 'lab', 'office', 'facility', 'other'],
      default: 'classroom'
    },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    coverImage: { type: String },
    photos: [{ type: String }],
    verified: { type: Boolean, default: false },
    location: {
      lat: Number,
      lng: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);

