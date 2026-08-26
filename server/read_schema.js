import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.homedir(), '.n8n', 'database.sqlite');
console.log('Opening database:', dbPath);

try {
  const db = new DatabaseSync(dbPath);
  
  // PRAGMA table_info
  const columns = db.prepare("PRAGMA table_info(workflow_entity)");
  console.log('Table columns:', columns.all());
} catch (e) {
  console.error('Error reading database:', e);
}
