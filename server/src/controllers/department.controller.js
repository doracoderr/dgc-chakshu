const Department = require('../models/Department');

exports.getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find();
    res.json({ success: true, message: 'OK', data: departments });
  } catch (err) {
    next(err);
  }
};

exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate('blockId', 'name code');
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'OK', data: department });
  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json({ success: true, message: 'Department created', data: department });
  } catch (err) {
    next(err);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'Department updated', data: department });
  } catch (err) {
    next(err);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'Department deleted', data: department });
  } catch (err) {
    next(err);
  }
};
