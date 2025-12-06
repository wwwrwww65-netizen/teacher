const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async create({ username, email, password, role }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, email, hashedPassword, role || 'student']
        );
        return result.rows[0];
    }

    static async findByEmail(email) {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async validatePassword(user, password) {
        return await bcrypt.compare(password, user.password_hash);
    }
}

module.exports = User;
