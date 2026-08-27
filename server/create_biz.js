import bcrypt from 'bcrypt';
import pool from './config/db.js';

async function run() {
  const hash = await bcrypt.hash('business', 10);
  await pool.query('INSERT INTO users (id, name, email, role, password_hash) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING', ['biz-1', 'Business User', 'business@gmail.com', 'Business', hash]);
  console.log('Business user created');
  process.exit(0);
}
run().catch(console.error);
