const Room = require('../models/Room');

exports.getRoomsByBlock = async (req, res, next) => {
  try {
    const rooms = await Room.find({ blockId: req.params.blockId, verified: true });
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
