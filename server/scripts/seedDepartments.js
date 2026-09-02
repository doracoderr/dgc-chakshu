/**
 * Clears ALL existing departments (including any old/dummy ones from
 * seed.js) and their faculty, then creates the 20 DGC departments from
 * Department_Details.pdf fresh. Faculty is NOT re-added.
 *
 * CS, Political Science and English are linked to the existing Block
 * documents created by seedCampusBuildings.js (matched by Block code).
 *
 * Usage:
 *   cd server
 *   node scripts/seedDepartments.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Block = require('../src/models/Block');
const Department = require('../src/models/Department');
const Faculty = require('../src/models/Faculty');

// blockCode links a department to an already-seeded Block (optional)
const DEPARTMENTS = [
  {
    code: 'CS',
    name: 'Computer Science',
    blockCode: 'CSDEPT',
    hodName: '',
    description:
      'Broad theoretical background with a wide range of programming languages and paradigms. Students work on substantial programming and software development projects. Facilities include LCD projectors, computers, and internet for teaching-learning.',
  },
  {
    code: 'CHEM',
    name: 'Chemistry',
    hodName: 'Dr. Madhusudan Goyal',
    description:
      'Integral part of the college since its inception, offering interdisciplinary courses under Bachelor of Science.',
  },
  {
    code: 'PHY',
    name: 'Physics',
    hodName: '',
    description:
      'Established in 1962, with well-equipped labs and highly qualified faculty covering practical and theoretical aspects.',
  },
  {
    code: 'ZOO',
    name: 'Zoology',
    hodName: '',
    description:
      'Study of animals, wildlife, humans and their biological systems, with well-equipped labs and smart classrooms.',
  },
  {
    code: 'BIOTECH',
    name: 'Biotechnology',
    hodName: '',
    description:
      'Applications of scientific methods to improve biological systems — biochemistry, bioprocess technology, genomics, genetic engineering, molecular biology, immunology, microbiology.',
  },
  {
    code: 'BOT',
    name: 'Botany',
    hodName: '',
    description:
      'Broad theoretical and practical foundation with fully equipped labs and high-speed internet access.',
  },
  {
    code: 'MATH',
    name: 'Mathematics',
    hodName: '',
    description:
      'Started with the college establishment in 1951. Well-equipped Mathematics lab and dedicated faculty.',
  },
  {
    code: 'ECO',
    name: 'Economics',
    hodName: '',
    description:
      'Elective in B.A. Pass, compulsory in B.Com/B.B.A./M.Com, and offered as B.A. Economics Hons. 7 faculty members.',
  },
  {
    code: 'ENG',
    name: 'English',
    blockCode: 'ENGDEPT',
    hodName: '',
    description:
      'Compulsory subject in B.A./B.Sc. Pass and qualifying paper in Hons courses. Offers B.A. English Hons. English Language Lab available.',
  },
  {
    code: 'PUBADMIN',
    name: 'Public Administration',
    hodName: '',
    description:
      'Multidisciplinary field focused on management and implementation of public policies and programs.',
  },
  {
    code: 'HIST',
    name: 'History',
    hodName: '',
    description:
      'Offers B.A. pass and History Hons at UG and PG level, with 6 highly qualified faculty members.',
  },
  {
    code: 'SOC',
    name: 'Sociology',
    hodName: '',
    description:
      'Established in 1992 by founder Dr. Sanjivam Bhalla. PG course started in 2009 by Dr. Dalbir Singh & Mrs. Renu Singh.',
  },
  {
    code: 'PE',
    name: 'Physical Education',
    hodName: '',
    description:
      'Offers UG and PG courses including UGC-approved MPES. Faculty includes Padma Shri & Dronacharya Awardee Dr. Sunil Dabas.',
  },
  {
    code: 'SANS',
    name: 'Sanskrit',
    hodName: '',
    description:
      'Offered as B.A. elective/hons/compulsory, B.Sc. compulsory, Eng. Hons compulsory. Sanskrit language lab available.',
  },
  {
    code: 'PHIL',
    name: 'Philosophy',
    hodName: '',
    description:
      'One of the oldest departments, offered with Pol. Science, History, Economics, Sociology, Psychology & Sanskrit, and as subsidiary for English Hons.',
  },
  {
    code: 'GEO',
    name: 'Geography',
    hodName: '',
    description:
      'Taught since 1980 as an elective subject in B.A. pass course, with 7 highly qualified staff members.',
  },
  {
    code: 'HIN',
    name: 'Hindi',
    hodName: '',
    description:
      'PG classes running continuously since 2009. Hindi/Sanskrit language lab active since 2021 for tech-enabled learning.',
  },
  {
    code: 'POLSCI',
    name: 'Political Science',
    blockCode: 'POLSCI',
    hodName: '',
    description:
      'Established in 1951, one of the oldest departments. Introduced M.A. Political Science in 2009. Ten assistant professors.',
  },
  {
    code: 'PSY',
    name: 'Psychology',
    hodName: '',
    description:
      'Introduced in 1984. Runs four programs including job-oriented courses in guidance and counselling, with a guidance and counselling cell.',
  },
  {
    code: 'COM',
    name: 'Commerce',
    hodName: '',
    description:
      'Started with the college establishment in 1951; M.Com program started in 2021.',
  },
];

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set. Run this from the server/ folder with a valid .env.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await Department.find({}, '_id name');
  if (existing.length) {
    const existingIds = existing.map((d) => d._id);
    const facResult = await Faculty.deleteMany({ departmentId: { $in: existingIds } });
    console.log(`Removed ${existing.length} existing departments (${facResult.deletedCount} linked faculty records):`);
    existing.forEach((d) => console.log(`  - ${d.name}`));
    await Department.deleteMany({ _id: { $in: existingIds } });
  } else {
    console.log('No existing departments found.');
  }

  let deptCreated = 0;

  for (const d of DEPARTMENTS) {
    let block = null;
    if (d.blockCode) {
      block = await Block.findOne({ code: d.blockCode });
    }

    await Department.create({
      name: d.name,
      code: d.code,
      description: d.description,
      hodName: d.hodName || undefined,
      blockId: block ? block._id : undefined,
    });
    deptCreated++;
    console.log(`Created: ${d.name}${block ? `  (linked to block ${d.blockCode})` : ''}`);
  }

  console.log(`\nDone. ${deptCreated} departments created.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
