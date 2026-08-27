const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { getRoomsByBlock, getRoomById, getAllRoomsAdmin, createRoom, updateRoom, deleteRoom } = require('../controllers/room.controller');

router.get('/block/:blockId', getRoomsByBlock);
router.get('/admin/all', adminAuth, getAllRoomsAdmin);
router.get('/:id', getRoomById);
router.post('/', adminAuth, createRoom);
router.put('/:id', adminAuth, updateRoom);
router.delete('/:id', adminAuth, deleteRoom);

module.exports = router;
