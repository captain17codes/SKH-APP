import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.homedir(), '.n8n', 'database.sqlite');
console.log('Opening database:', dbPath);

try {
  const db = new DatabaseSync(dbPath);
  const stmt = db.prepare("SELECT data FROM execution_data ORDER BY executionId DESC LIMIT 1");
  const row = stmt.get();
  if (row && row.data) {
    console.log('Raw data length:', row.data.length);
    console.log('Raw data snippet:', row.data.substring(0, 1000));
  } else {
    console.log('No data found.');
  }
} catch (e) {
  console.error(e);
}
