const Block = require('../models/Block');

exports.getAllBlocks = async (req, res, next) => {
  try {
    const blocks = await Block.find();
    res.json({ success: true, message: 'OK', data: blocks });
  } catch (err) {
    next(err);
  }
};

exports.getBlockById = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'OK', data: block });
  } catch (err) {
    next(err);
  }
};
