const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const c = require('../controllers/program.controller');

router.get('/', c.list);
router.get('/admin/all', adminAuth, c.listAdmin);
router.get('/:id', c.get);
router.post('/', adminAuth, c.create);
router.put('/:id', adminAuth, c.update);
router.delete('/:id', adminAuth, c.remove);

module.exports = router;
