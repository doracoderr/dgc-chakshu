require('dotenv').config();
const mongoose = require('mongoose');
const Block = require('./src/models/Block');
const Department = require('./src/models/Department');
const Room = require('./src/models/Room');
const Faculty = require('./src/models/Faculty');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data (comment these out if you want to keep old data)
  await Promise.all([
    Block.deleteMany({}),
    Department.deleteMany({}),
    Room.deleteMany({}),
    Faculty.deleteMany({}),
  ]);

  const blocks = await Block.insertMany([
    {
      name: 'Block A',
      code: 'A',
      description: 'Main administrative block with reception and offices.',
      floorCount: 3,
    },
    {
      name: 'Block B',
      code: 'B',
      description: 'Computer Science and IT department block.',
      floorCount: 4,
    },
    {
      name: 'Block C',
      code: 'C',
      description: 'Library, seminar halls and exam cell.',
      floorCount: 2,
    },
  ]);

  const [blockA, blockB, blockC] = blocks;

  const departments = await Department.insertMany([
    {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      blockId: blockB._id,
      description: 'Runs BTech and MCA programs.',
      hodName: 'Dr. Rakesh Kumar',
      contactEmail: 'cse@dgc.edu',
    },
    {
      name: 'Information Technology',
      code: 'IT',
      blockId: blockB._id,
      description: 'Runs BTech IT program.',
      hodName: 'Dr. Anita Sharma',
      contactEmail: 'it@dgc.edu',
    },
    {
      name: 'Administration',
      code: 'ADMIN',
      blockId: blockA._id,
      description: 'Admissions, accounts and general administration.',
      hodName: 'Mr. Suresh Yadav',
      contactEmail: 'admin@dgc.edu',
    },
  ]);

  const [cse, it] = departments;

  const rooms = await Room.insertMany([
    {
      blockId: blockB._id,
      floorNumber: 2,
      roomNumber: 'B-201',
      name: 'CSE Faculty Office',
      type: 'office',
      departmentId: cse._id,
      verified: true,
    },
    {
      blockId: blockB._id,
      floorNumber: 3,
      roomNumber: 'B-301',
      name: 'Programming Lab 1',
      type: 'lab',
      departmentId: cse._id,
      verified: true,
    },
    {
      blockId: blockB._id,
      floorNumber: 1,
      roomNumber: 'B-101',
      name: 'IT Department Office',
      type: 'office',
      departmentId: it._id,
      verified: true,
    },
  ]);

  const [cseOffice] = rooms;

  await Faculty.insertMany([
    {
      name: 'Dr. Rakesh Kumar',
      designation: 'HOD, CSE',
      departmentId: cse._id,
      roomId: cseOffice._id,
      approvedForDisplay: true,
    },
    {
      name: 'Ms. Priya Verma',
      designation: 'Assistant Professor, CSE',
      departmentId: cse._id,
      roomId: cseOffice._id,
      approvedForDisplay: true,
    },
    {
      name: 'Dr. Anita Sharma',
      designation: 'HOD, IT',
      departmentId: it._id,
      approvedForDisplay: true,
    },
  ]);

  console.log('Seed data inserted successfully');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
