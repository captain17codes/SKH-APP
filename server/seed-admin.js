import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new pg.Pool(poolConfig);

async function seedAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  try {
    await pool.query(
      `INSERT INTO users (id, name, email, role, password_hash) VALUES ('U1', 'Super Admin', 'admin@kopargaon.gov.in', 'Admin', $1) ON CONFLICT (email) DO NOTHING`,
      [hash]
    );
    console.log('✅ Admin user seeded (admin@kopargaon.gov.in / admin123)');
  } catch (e) {
    console.error('❌ Error seeding admin', e);
  }
  pool.end();
}

seedAdmin();
