const express = require('express');
const router = express.Router();
const { getAllBlocks, getBlockById } = require('../controllers/block.controller');

router.get('/', getAllBlocks);
router.get('/:id', getBlockById);

module.exports = router;
