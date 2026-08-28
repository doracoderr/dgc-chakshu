const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'];

  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({
      success: false,
      message: 'ADMIN_KEY not configured on server',
      error: { code: 'SERVER_MISCONFIGURED' },
    });
  }

  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing admin key',
      error: { code: 'UNAUTHORIZED' },
    });
  }

  next();
};

module.exports = adminAuth;
