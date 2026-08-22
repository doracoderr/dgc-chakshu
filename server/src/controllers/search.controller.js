const Room = require('../models/Room');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');

exports.search = async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query param "q" is required', error: { code: 'MISSING_QUERY' } });
    }

    const regex = new RegExp(q, 'i');

    const [rooms, departments, faculty] = await Promise.all([
      Room.find({ name: regex, verified: true }).limit(10),
      Department.find({ name: regex }).limit(10),
      Faculty.find({ name: regex, approvedForDisplay: true }).limit(10)
    ]);

    res.json({
      success: true,
      message: 'OK',
      data: { rooms, departments, faculty }
    });
  } catch (err) {
    next(err);
  }
};
