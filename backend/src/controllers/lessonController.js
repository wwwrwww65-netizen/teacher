const { Configuration, OpenAIApi } = require("openai");
const db = require('../config/db');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.generateLesson = async (req, res) => {
    try {
        const { subject, level, language } = req.body;
        const userId = req.user.id;

        const prompt = `Create a comprehensive lesson plan for ${subject} at a ${level} level in ${language || 'English'}. Include key concepts, examples, and a summary. Format as Markdown.`;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });

        const content = completion.data.choices[0].message.content;

        const result = await db.query(
            'INSERT INTO lessons (user_id, subject, level, content, ai_prompt) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, subject, level, content, prompt]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating lesson' });
    }
};

exports.getLessons = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT * FROM lessons WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLessonById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM lessons WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
