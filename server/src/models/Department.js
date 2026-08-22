const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    description: { type: String },
    hodName: { type: String },
    contactEmail: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
