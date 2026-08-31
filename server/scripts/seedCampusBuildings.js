/**
 * Upserts the campus buildings identified from the GPS-tagged photos,
 * with their exact latitude/longitude — no manual typing, no risk of
 * pinning a building at the wrong spot.
 *
 * Safe to re-run: if a Block already exists (matched by code OR a known
 * name alias, e.g. an existing "APJ Block" entry), its location/name/
 * description are updated in place instead of creating a duplicate.
 *
 * Usage:
 *   cd server
 *   node scripts/seedCampusBuildings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Block = require('../src/models/Block');

const BUILDINGS = [
  {
    code: 'CSDEPT',
    name: 'Department of Computer Science',
    description: 'Department of Computer Science (1st floor).',
    location: { lat: 28.466656, lng: 77.023505 },
    aliases: ['computer science', 'dept. of computer science', 'department of computer science'],
  },
  {
    code: 'POLSCI',
    name: 'Department of Political Science',
    description: 'राजनीति विज्ञान विभाग — Department of Political Science.',
    location: { lat: 28.466533, lng: 77.023522 },
    aliases: ['political science', 'rajniti vigyan vibhag', 'department of political science'],
  },
  {
    code: 'ENGDEPT',
    name: 'Department of English',
    description: 'Department of English (Room 62).',
    location: { lat: 28.466528, lng: 77.022994 },
    aliases: ['department of english', 'english department'],
  },
  {
    code: 'LIB',
    name: 'Library & Information Centre',
    description: 'Swami... Library & Information Centre.',
    location: { lat: 28.466343, lng: 77.023316 },
    aliases: ['library', 'library & information centre', 'library and information centre'],
  },
  {
    code: 'ARTS',
    name: 'Arts Block',
    description: 'Arts Block.',
    location: { lat: 28.466301, lng: 77.023235 },
    aliases: ['arts block'],
  },
  {
    code: 'RKHALL',
    name: 'R.K. Hall',
    description: 'R.K. Hall — seminar hall / auditorium.',
    location: { lat: 28.466532, lng: 77.023125 },
    aliases: ['r.k. hall', 'rk hall'],
  },
  {
    code: 'APJ',
    name: 'A.P.J. Kalam Block',
    description: 'A.P.J. Kalam Block.',
    // averaged from 3 photos taken at slightly different spots on the same building
    location: { lat: 28.466674, lng: 77.023523 },
    aliases: ['apj block', 'a.p.j. kalam block', 'apj kalam block'],
  },
  {
    code: 'IGNOU',
    name: 'IGNOU Study Centre',
    description: 'IGNOU Study Centre.',
    location: { lat: 28.468003, lng: 77.024534 },
    aliases: ['ignou study centre', 'ignou'],
  },
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set. Run this from the server/ folder with a valid .env.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const b of BUILDINGS) {
    const nameRegexes = [b.name, ...b.aliases].map((n) => new RegExp(`^${escapeRegex(n)}$`, 'i'));

    let existing = await Block.findOne({ code: b.code });
    if (!existing) {
      existing = await Block.findOne({ name: { $in: nameRegexes } });
    }

    if (existing) {
      existing.name = b.name;
      existing.description = existing.description || b.description;
      existing.location = b.location;
      await existing.save();
      console.log(`Updated: ${b.name}  ->  lat ${b.location.lat}, lng ${b.location.lng}`);
    } else {
      await Block.create({
        name: b.name,
        code: b.code,
        description: b.description,
        location: b.location,
        floorCount: 1,
      });
      console.log(`Created: ${b.name}  ->  lat ${b.location.lat}, lng ${b.location.lng}`);
    }
  }

  console.log('\nDone. All 8 buildings are now pinned with their exact coordinates.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
