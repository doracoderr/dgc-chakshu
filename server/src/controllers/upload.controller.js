const cloudinary = require('../config/cloudinary');

const BASE_FOLDER = 'dgc-chakshu';
const ALLOWED_TYPES = {
  block: 'blocks',
   department: 'departments',
  room: 'rooms',
  faculty: 'faculty',
};

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

exports.getUploadSignature = async (req, res, next) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured on the server',
        error: { code: 'SERVER_MISCONFIGURED' },
      });
    }

    const requestedType = req.query.type;
    const subFolder = ALLOWED_TYPES[requestedType];

    if (!subFolder) {
      return res.status(400).json({
        success: false,
        message: `Invalid or missing "type". Must be one of: ${Object.keys(ALLOWED_TYPES).join(', ')}`,
        error: { code: 'INVALID_TYPE' },
      });
    }

    const rawName = (req.query.name || '').trim();
    const slug = slugify(rawName) || 'untitled';
    const folder = `${BASE_FOLDER}/${subFolder}/${slug}`;

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp, folder };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

    res.json({
      success: true,
      message: 'OK',
      data: {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder,
      },
    });
  } catch (err) {
    next(err);
  }
};
