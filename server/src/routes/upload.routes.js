const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { getUploadSignature } = require('../controllers/upload.controller');

router.get('/signature', adminAuth, getUploadSignature);

module.exports = router;
