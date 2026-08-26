import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.homedir(), '.n8n', 'database.sqlite');
console.log('Opening database:', dbPath);

try {
  const db = new DatabaseSync(dbPath);
  const query = db.prepare("SELECT * FROM webhook_entity");
  console.log('Webhooks in database:', query.all());
} catch (e) {
  console.error('Error reading database:', e);
}
