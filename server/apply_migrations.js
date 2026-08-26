import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const filesToRun = ['004_scenarios.sql', '005_milestones.sql', '006_master_gis_catalog.sql'];

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
