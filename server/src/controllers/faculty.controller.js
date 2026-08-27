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

exports.getAllFacultyAdmin = async (req, res, next) => {
  try {
    const faculty = await Faculty.find().populate('departmentId', 'name');
    res.json({ success: true, message: 'OK', data: faculty });
  } catch (err) {
    next(err);
  }
};

exports.createFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json({ success: true, message: 'Faculty created', data: faculty });
  } catch (err) {
    next(err);
  }
};

exports.updateFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'Faculty updated', data: faculty });
  } catch (err) {
    next(err);
  }
};

exports.deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'Faculty deleted', data: faculty });
  } catch (err) {
    next(err);
  }
};
