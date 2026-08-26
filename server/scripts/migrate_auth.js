import fs from 'fs';
import path from 'path';
import { query } from '../config/db.js';

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const sql = fs.readFileSync(path.join(process.cwd(), '../database/migrations/003_auth_tables.sql'), 'utf8');
    console.log('Executing migration...');
    await query(sql);
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
