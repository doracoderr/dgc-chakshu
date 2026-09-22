const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const c = require('../controllers/timetable.controller');

router.get('/', c.list);
router.get('/filters', c.filters);
router.post('/extract', adminAuth, c.extract);
router.post('/bulk', adminAuth, c.bulkSave);
router.post('/', adminAuth, c.create);
router.put('/:id', adminAuth, c.update);
router.delete('/:id', adminAuth, c.remove);

module.exports = router;
