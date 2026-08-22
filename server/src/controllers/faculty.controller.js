const Faculty = require('../models/Faculty');

exports.getAllFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.find({ approvedForDisplay: true }).populate('departmentId', 'name');
    res.json({ success: true, message: 'OK', data: faculty });
  } catch (err) {
    next(err);
  }
};

exports.getFacultyById = async (req, res, next) => {
  try {
    const faculty = await Faculty.findOne({ _id: req.params.id, approvedForDisplay: true });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'OK', data: faculty });
  } catch (err) {
    next(err);
  }
};
