import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const files = fs.readdirSync(migrationsDir);
  const filesToRun = files.filter(f => f.endsWith('.sql')).sort();

  try {
    for (const file of filesToRun) {
      console.log(`Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      await pool.query(sql);
      console.log(`Successfully applied ${file}`);
    }
    console.log('All migrations applied successfully.');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

runMigrations();
