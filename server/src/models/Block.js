const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    coverImage: { type: String },
    floorCount: { type: Number, default: 1 },
    location: {
      lat: Number,
      lng: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Block', blockSchema);
