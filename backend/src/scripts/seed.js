const db = require('../config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        console.log('Seeding database...');

        // Create a test user
        const passwordHash = await bcrypt.hash('password123', 10);
        const userRes = await db.query(
            `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING 
       RETURNING id`,
            ['demo_student', 'student@demo.com', passwordHash, 'student']
        );

        let userId;
        if (userRes.rows.length > 0) {
            userId = userRes.rows[0].id;
        } else {
            const existing = await db.query('SELECT id FROM users WHERE email = $1', ['student@demo.com']);
            userId = existing.rows[0].id;
        }

        // Create a sample lesson
        const lessonRes = await db.query(
            `INSERT INTO lessons (user_id, subject, level, content, ai_prompt)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
            [
                userId,
                'Mathematics',
                'beginner',
                '# Introduction to Algebra\n\nAlgebra is a branch of mathematics...',
                'Generate algebra lesson'
            ]
        );

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seed();
