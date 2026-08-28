const cloudinary = require('../config/cloudinary');

const UPLOAD_FOLDER = 'dgc-chakshu';

exports.getUploadSignature = async (req, res, next) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured on the server',
        error: { code: 'SERVER_MISCONFIGURED' },
      });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp, folder: UPLOAD_FOLDER };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

    res.json({
      success: true,
      message: 'OK',
      data: {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder: UPLOAD_FOLDER,
      },
    });
  } catch (err) {
    next(err);
  }
};
