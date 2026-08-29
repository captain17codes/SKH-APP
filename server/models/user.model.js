import pool, { query } from '../config/db.js';

// Pre-seeded / fallback registered users with hashed passwords
// admin123 -> $2b$10$cLR2q6lI/18Uaft9gG26WuP9PH.2Y3zNhXLGgumaS/jjFbTPvuC2C
// citizen  -> $2b$10$qXPGL1N28RWJCAT4kn.a5u.x.7AwFgzZXOVk.s6h.yHDUSy4//H8i
// business -> $2b$10$M2EEdgrCB1THN3irdWvAduZpxAQzWIRawLdaBjNNYl71r5xkexhre
const fallbackUsers = [
  {
    id: 'U1',
    name: 'Super Admin',
    email: 'admin@kopargaon.gov.in',
    phone: '+91 98220 11223',
    role: 'Admin',
    password_hash: '$2b$10$cLR2q6lI/18Uaft9gG26WuP9PH.2Y3zNhXLGgumaS/jjFbTPvuC2C',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'admin-12345',
    name: 'System Admin',
    email: 'admin@kopargaon.gov',
    phone: '+91 98220 11224',
    role: 'Admin',
    password_hash: '$2b$10$cLR2q6lI/18Uaft9gG26WuP9PH.2Y3zNhXLGgumaS/jjFbTPvuC2C',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'CIT-1',
    name: 'Test Citizen',
    email: 'citizen@gmail.com',
    phone: '+91 98900 33445',
    role: 'Citizen',
    password_hash: '$2b$10$qXPGL1N28RWJCAT4kn.a5u.x.7AwFgzZXOVk.s6h.yHDUSy4//H8i',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'BIZ-1',
    name: 'Demo Investor',
    email: 'business@gmail.com',
    phone: '+91 97650 55667',
    role: 'Business',
    password_hash: '$2b$10$M2EEdgrCB1THN3irdWvAduZpxAQzWIRawLdaBjNNYl71r5xkexhre',
    created_at: '2026-01-01T00:00:00.000Z'
  }
];

export const createUser = async (user) => {
  const { id, name, phone, email, role, password_hash } = user;
  const normalizedEmail = (email || '').trim().toLowerCase();

  try {
    const result = await query(
      `INSERT INTO users (id, name, phone, email, role, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, created_at`,
      [id, name, phone, normalizedEmail, role, password_hash]
    );
    return result.rows[0];
  } catch (error) {
    console.warn('[USER MODEL] DB insert failed, adding to fallback user store:', error.message);
    const newUser = {
      id: id || `USR-${Date.now()}`,
      name,
      phone,
      email: normalizedEmail,
      role: role || 'Citizen',
      password_hash,
      created_at: new Date().toISOString()
    };
    fallbackUsers.push(newUser);
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.created_at
    };
  }
};

export const getUserByEmail = async (email) => {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await query('SELECT * FROM users WHERE LOWER(TRIM(email)) = $1', [normalizedEmail]);
    if (result && result.rows && result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (error) {
    // Database unreachable or query failed — continue to check registered fallback accounts
    console.warn('[USER MODEL] DB lookup failed, falling back to registered user store:', error.message);
  }

  // Check fallback store
  const found = fallbackUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  return found || null;
};

export const getUserById = async (id) => {
  if (!id) return null;

  try {
    const result = await query('SELECT id, name, phone, email, role, created_at FROM users WHERE id = $1', [id]);
    if (result && result.rows && result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (error) {
    console.warn('[USER MODEL] DB lookup by ID failed, falling back to registered user store:', error.message);
  }

  const found = fallbackUsers.find(u => u.id === id);
  if (!found) return null;
  return {
    id: found.id,
    name: found.name,
    phone: found.phone,
    email: found.email,
    role: found.role,
    created_at: found.created_at
  };
};

export const updatePassword = async (id, password_hash) => {
  try {
    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
      [password_hash, id]
    );
    if (result && result.rows && result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (error) {
    console.warn('[USER MODEL] DB password update failed, updating fallback store:', error.message);
  }

  const user = fallbackUsers.find(u => u.id === id);
  if (user) {
    user.password_hash = password_hash;
    return { id: user.id };
  }
  return null;
};
