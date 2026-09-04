/**
 * Migrates every faculty member's photo from the external
 * "mis.highereduhry.ac.in" URL (which is slow / hotlink-protected
 * and randomly times out) into our own Cloudinary account, so the
 * images become permanent and always load.
 *
 * Unlike the first version, this script does NOT ask Cloudinary to
 * fetch the remote URL itself (that kept timing out). Instead it:
 *   1. Downloads the image itself, with browser-like headers
 *      (User-Agent + Referer), with retries.
 *   2. Uploads the downloaded bytes straight to Cloudinary.
 *
 * Safe to re-run: any faculty whose photo is already a Cloudinary
 * URL (res.cloudinary.com) is skipped.
 *
 * Usage:
 *   cd server
 *   node scripts/migrateFacultyImagesToCloudinary.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('../src/config/cloudinary');
const Faculty = require('../src/models/Faculty');

const BASE_FOLDER = 'dgc-chakshu/faculty';
const MAX_ATTEMPTS = 3;
const DOWNLOAD_TIMEOUT_MS = 20000;

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'untitled';
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadImage(url) {
  let lastErr;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: 'https://mis.highereduhry.ac.in/',
        },
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        throw new Error('Empty response body');
      }

      return buffer;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;

      if (attempt < MAX_ATTEMPTS) {
        await delay(1000 * attempt);
      }
    }
  }

  throw lastErr;
}

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, timeout: 60000 },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set. Run this from the server/ folder with a valid .env.');
    process.exit(1);
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Cloudinary env vars (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET) are not set.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const allFaculty = await Faculty.find({});
  console.log(`Found ${allFaculty.length} faculty members.\n`);

  let migrated = 0;
  let skipped = 0;
  const failed = [];

  for (const member of allFaculty) {
    const currentUrl = member.photo;

    if (!currentUrl) {
      skipped++;
      continue;
    }

    if (currentUrl.includes('res.cloudinary.com')) {
      skipped++;
      continue;
    }

    const slug = `${slugify(member.name)}-${member._id.toString().slice(-6)}`;
    const folder = `${BASE_FOLDER}/${slug}`;

    try {
      const buffer = await downloadImage(currentUrl);
      const result = await uploadBufferToCloudinary(buffer, folder);

      member.photo = result.secure_url;
      await member.save();

      migrated++;
      console.log(`✅ [${migrated}] ${member.name} -> ${result.secure_url}`);
    } catch (err) {
      failed.push(`${member.name} (${member._id}) - ${err.message}`);
      console.log(`❌ ${member.name} - ${err.message}`);
    }

    // Small delay so we don't hammer the source server / Cloudinary.
    await delay(400);
  }

  console.log('\n================ SUMMARY ================');
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (already Cloudinary or no photo): ${skipped}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed faculty (source image unreachable even after retries):');
    failed.forEach((line) => console.log(`  - ${line}`));
    console.log('\nFor these, open Admin Panel -> Faculty -> Edit -> upload a photo manually.');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});