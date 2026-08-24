import pool, { query } from '../config/db.js';

export const createUser = async (user) => {
  const { id, name, phone, email, role, password_hash } = user;
  const result = await query(
    `INSERT INTO users (id, name, phone, email, role, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, role, created_at`,
    [id, name, phone, email, role, password_hash]
  );
  return result.rows[0];
};

export const getUserByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

export const getUserById = async (id) => {
  const result = await query('SELECT id, name, phone, email, role, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

export const updatePassword = async (id, password_hash) => {
  const result = await query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
    [password_hash, id]
  );
  return result.rows[0];
};
