const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { getAllDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/department.controller');

router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);
router.post('/', adminAuth, createDepartment);
router.put('/:id', adminAuth, updateDepartment);
router.delete('/:id', adminAuth, deleteDepartment);

module.exports = router;
