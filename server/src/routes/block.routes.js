const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { getAllBlocks, getBlockById, createBlock, updateBlock, deleteBlock } = require('../controllers/block.controller');

router.get('/', getAllBlocks);
router.get('/:id', getBlockById);
router.post('/', adminAuth, createBlock);
router.put('/:id', adminAuth, updateBlock);
router.delete('/:id', adminAuth, deleteBlock);

module.exports = router;
