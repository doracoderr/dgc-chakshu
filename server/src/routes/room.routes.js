const express = require('express');
const router = express.Router();
const { getRoomsByBlock, getRoomById } = require('../controllers/room.controller');

router.get('/block/:blockId', getRoomsByBlock);
router.get('/:id', getRoomById);

module.exports = router;
