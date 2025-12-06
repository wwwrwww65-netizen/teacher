const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/generate', quizController.generateQuiz);
router.post('/submit', quizController.submitQuiz);
router.get('/:id', quizController.getQuizById);

module.exports = router;
