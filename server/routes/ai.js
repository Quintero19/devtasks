const express = require('express');
const { generateTasks } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.post('/generate-tasks', generateTasks);

module.exports = router;
