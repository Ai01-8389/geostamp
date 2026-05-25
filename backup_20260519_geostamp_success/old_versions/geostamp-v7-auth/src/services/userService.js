const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../database');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

const findById = async (id) => {
    const result = await query(
        'SELECT id, email, display_name, avatar_url, email_verified, created_at FROM users WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
};

const findByEmail = async (email) => {
    const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
    );
    return result.rows[0] || null;
};

const findByGoogleId = async (googleId) => {
    const result = await query(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId]
    );
    return result.rows[0] || null;
};

const create = async ({ email, password, displayName, googleId, avatarUrl }) => {
    const hashedPassword = password ? await bcrypt.hash(password, BCRYPT_ROUNDS) : null;
    
    const result = await query(
        `INSERT INTO users (email, password_hash, google_id, display_name, avatar_url, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, display_name, avatar_url, email_verified, created_at`,
        [
            email.toLowerCase(),
            hashedPassword,
            googleId || null,
            displayName || null,
            avatarUrl || null,
            googleId ? true : false
        ]
    );
    
    return result.rows[0];
};

const update = async (id, updates) => {
    const allowedFields = ['display_name', 'avatar_url', 'email_verified'];
    const setClause = [];
    const values = [id];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    if (setClause.length === 0) {
        return findById(id);
    }

    const result = await query(
        `UPDATE users SET ${setClause.join(', ')} WHERE id = $1
         RETURNING id, email, display_name, avatar_url, email_verified, created_at`,
        values
    );
    
    return result.rows[0];
};

const verifyPassword = async (user, password) => {
    if (!user.password_hash) {
        return false;
    }
    return bcrypt.compare(password, user.password_hash);
};

const updatePassword = async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, userId]
    );
};

const linkGoogleAccount = async (userId, googleId, avatarUrl) => {
    const result = await query(
        `UPDATE users SET google_id = $1, avatar_url = COALESCE($2, avatar_url), email_verified = true
         WHERE id = $3
         RETURNING id, email, display_name, avatar_url, email_verified`,
        [googleId, avatarUrl, userId]
    );
    return result.rows[0];
};

const deleteUser = async (userId) => {
    await query('DELETE FROM users WHERE id = $1', [userId]);
};

module.exports = {
    findById,
    findByEmail,
    findByGoogleId,
    create,
    update,
    verifyPassword,
    updatePassword,
    linkGoogleAccount,
    deleteUser
};
