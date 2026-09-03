const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    coverImage: { type: String },
    floorCount: { type: Number, default: 1 },
    // 'building' = a real teaching/admin block with floors and rooms.
    // 'landmark' = a statue, gate, or other marker shown on the map that
    // isn't a building (no floors/rooms — shouldn't be labelled "Building").
    category: { type: String, enum: ['building', 'landmark'], default: 'building' },
    location: {
      lat: Number,
      lng: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Block', blockSchema);