const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    coverImage: { type: String },
    floorCount: { type: Number, default: 1 },
    // 'building' = a real teaching/admin block with floors and rooms.
    // 'landmark' = a statue, gate, or other decorative/historic marker.
    // 'facility' = a real-use space with no floor tracking (canteen, hall).
    // 'amenity'  = a small utility marker (washroom, water point, etc).
    // Anything other than 'building' is shown on the map only — no
    // floor/room UI, and excluded from the main Blocks directory.
    category: {
      type: String,
      enum: ['building', 'landmark', 'facility', 'amenity'],
      default: 'building',
    },
    location: {
      lat: Number,
      lng: Number
    },
    // Only meaningful for category !== 'building' — e.g. Principal Office
    // or Admission Counters that physically sit inside a real block
    // (like Admin Block) rather than being their own building.
    parentBlockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    floorNumber: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Block', blockSchema);