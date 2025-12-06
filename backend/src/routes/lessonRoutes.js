const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/generate', lessonController.generateLesson);
router.get('/', lessonController.getLessons);
router.get('/:id', lessonController.getLessonById);

module.exports = router;
