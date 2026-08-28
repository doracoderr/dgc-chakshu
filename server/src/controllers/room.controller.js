const Room = require('../models/Room');

exports.getRoomsByBlock = async (req, res, next) => {
  try {
    const rooms = await Room.find({ blockId: req.params.blockId, verified: true })
      .populate('departmentId', 'name')
      .sort({ floorNumber: 1, roomNumber: 1 });
    res.json({ success: true, message: 'OK', data: rooms });
  } catch (err) {
    next(err);
  }
};

exports.getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate('departmentId', 'name');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'OK', data: room });
  } catch (err) {
    next(err);
  }
};

exports.getAllRoomsAdmin = async (req, res, next) => {
  try {
    const rooms = await Room.find().populate('blockId', 'name').populate('departmentId', 'name');
    res.json({ success: true, message: 'OK', data: rooms });
  } catch (err) {
    next(err);
  }
};

exports.createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, message: 'Room created', data: room });
  } catch (err) {
    next(err);
  }
};

exports.updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'Room updated', data: room });
  } catch (err) {
    next(err);
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'Room deleted', data: room });
  } catch (err) {
    next(err);
  }
};
