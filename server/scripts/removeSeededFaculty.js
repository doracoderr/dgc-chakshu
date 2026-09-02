/**
 * One-time cleanup: removes all Faculty records whose departmentId belongs
 * to one of the 20 departments seeded by seedDepartments.js.
 *
 * Usage:
 *   cd server
 *   node scripts/removeSeededFaculty.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../src/models/Department');
const Faculty = require('../src/models/Faculty');

const CODES = [
  'CS', 'CHEM', 'PHY', 'ZOO', 'BIOTECH', 'BOT', 'MATH', 'ECO', 'ENG',
  'PUBADMIN', 'HIST', 'SOC', 'PE', 'SANS', 'PHIL', 'GEO', 'HIN',
  'POLSCI', 'PSY', 'COM',
];

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set. Run this from the server/ folder with a valid .env.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const departments = await Department.find({ code: { $in: CODES } });
  const departmentIds = departments.map((d) => d._id);

  const result = await Faculty.deleteMany({ departmentId: { $in: departmentIds } });
  console.log(`Deleted ${result.deletedCount} faculty records.`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
