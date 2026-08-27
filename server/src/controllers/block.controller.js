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

exports.createBlock = async (req, res, next) => {
  try {
    const block = await Block.create(req.body);
    res.status(201).json({ success: true, message: 'Block created', data: block });
  } catch (err) {
    next(err);
  }
};

exports.updateBlock = async (req, res, next) => {
  try {
    const block = await Block.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'Block updated', data: block });
  } catch (err) {
    next(err);
  }
};

exports.deleteBlock = async (req, res, next) => {
  try {
    const block = await Block.findByIdAndDelete(req.params.id);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found', error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, message: 'Block deleted', data: block });
  } catch (err) {
    next(err);
  }
};
