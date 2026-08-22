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
