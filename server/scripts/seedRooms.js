/**
 * Seeds physical Room documents inside Blocks — separate from the
 * Department records. A department only says "which block it's in";
 * rooms are the actual numbered rooms shown on that block's floor page,
 * and only show up publicly once verified: true.
 *
 * Add more rooms to the ROOMS array below as they're surveyed. Existing
 * rooms (matched by blockCode + roomNumber) are updated, not duplicated,
 * so this is safe to re-run.
 *
 * Usage:
 *   cd server
 *   node scripts/seedRooms.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Block = require('../src/models/Block');
const Department = require('../src/models/Department');
const Room = require('../src/models/Room');

const ROOMS = [
  {
    blockCode: 'ARTS',
    roomNumber: '62',
    name: 'Department of English',
    type: 'office',
    floorNumber: 0,
    departmentCode: 'ENG',
    verified: true,
  },
];

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set. Run this from the server/ folder with a valid .env.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const r of ROOMS) {
    const block = await Block.findOne({ code: r.blockCode });
    if (!block) {
      console.log(`Skipped Room ${r.roomNumber}: block "${r.blockCode}" not found.`);
      continue;
    }

    let department = null;
    if (r.departmentCode) {
      department = await Department.findOne({ code: r.departmentCode });
      if (!department) {
        console.log(`  Note: department "${r.departmentCode}" not found — room will be created without a linked department.`);
      }
    }

    const existing = await Room.findOne({ blockId: block._id, roomNumber: r.roomNumber });

    const payload = {
      blockId: block._id,
      floorNumber: r.floorNumber,
      roomNumber: r.roomNumber,
      name: r.name,
      type: r.type || 'classroom',
      departmentId: department ? department._id : undefined,
      verified: r.verified ?? true,
    };

    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      console.log(`Updated: Room ${r.roomNumber} — ${r.name} (${block.name})`);
    } else {
      await Room.create(payload);
      console.log(`Created: Room ${r.roomNumber} — ${r.name} (${block.name})`);
    }
  }

  console.log('\nDone. Add a photo for each room from Admin → Rooms if you have one.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
