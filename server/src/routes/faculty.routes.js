const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { getAllFaculty, getFacultyById, getAllFacultyAdmin, createFaculty, updateFaculty, deleteFaculty } = require('../controllers/faculty.controller');

router.get('/', getAllFaculty);
router.get('/admin/all', adminAuth, getAllFacultyAdmin);
router.get('/:id', getFacultyById);
router.post('/', adminAuth, createFaculty);
router.put('/:id', adminAuth, updateFaculty);
router.delete('/:id', adminAuth, deleteFaculty);

module.exports = router;
