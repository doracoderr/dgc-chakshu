const express = require('express');
const router = express.Router();
const { getAllFaculty, getFacultyById } = require('../controllers/faculty.controller');

router.get('/', getAllFaculty);
router.get('/:id', getFacultyById);

module.exports = router;
