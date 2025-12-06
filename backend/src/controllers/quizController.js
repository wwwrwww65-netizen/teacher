const { Configuration, OpenAIApi } = require("openai");
const db = require('../config/db');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.generateQuiz = async (req, res) => {
    try {
        const { lessonId } = req.body;

        // Fetch lesson content
        const lessonResult = await db.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
        if (lessonResult.rows.length === 0) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        const lesson = lessonResult.rows[0];

        const prompt = `Create a quiz with 5 multiple choice questions based on the following lesson content. Return the result as a JSON object with keys: "questions" (array of objects with "question", "options" (array), "correctAnswer"). Content: ${lesson.content.substring(0, 1000)}...`;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });

        let quizData;
        try {
            quizData = JSON.parse(completion.data.choices[0].message.content);
        } catch (e) {
            // Fallback if AI doesn't return pure JSON
            return res.status(500).json({ message: 'Failed to parse AI response', raw: completion.data.choices[0].message.content });
        }

        const result = await db.query(
            'INSERT INTO quizzes (lesson_id, questions) VALUES ($1, $2) RETURNING *',
            [lessonId, JSON.stringify(quizData)]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating quiz' });
    }
};

exports.submitQuiz = async (req, res) => {
    // Logic to grade quiz would go here
    res.json({ message: "Quiz submitted" });
}

exports.getQuizById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM quizzes WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
