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

async function seedUsers() {
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const businessHash = await bcrypt.hash('business', 10);
    const citizenHash = await bcrypt.hash('citizen', 10);

    // Ensure users table exists just in case
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        role VARCHAR(20),
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert Admin
    await pool.query(
      `INSERT INTO users (id, name, email, role, password_hash) VALUES ('U1', 'Super Admin', 'admin@kopargaon.gov.in', 'Admin', $1) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [adminHash]
    );

    // Insert Business
    await pool.query(
      `INSERT INTO users (id, name, email, role, password_hash) VALUES ('BIZ-1', 'Demo Investor', 'business@gmail.com', 'Business', $1) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [businessHash]
    );

    // Insert Citizen
    await pool.query(
      `INSERT INTO users (id, name, email, role, password_hash) VALUES ('CIT-1', 'Test Citizen', 'citizen@gmail.com', 'Citizen', $1) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [citizenHash]
    );

    console.log('✅ Test users seeded successfully!');
    console.log('Admin: admin@kopargaon.gov.in / admin123');
    console.log('Business: business@gmail.com / business');
    console.log('Citizen: citizen@gmail.com / citizen');

  } catch (e) {
    console.error('❌ Error seeding users', e);
  } finally {
    pool.end();
  }
}

seedUsers();
