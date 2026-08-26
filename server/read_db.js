import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.homedir(), '.n8n', 'database.sqlite');
console.log('Opening database:', dbPath);

try {
  const db = new DatabaseSync(dbPath);
  
  // Query detailed workflow info
  const query = db.prepare("SELECT id, name, active, triggerCount, isArchived, activeVersionId FROM workflow_entity");
  console.log('Workflows details:', query.all());
} catch (e) {
  console.error('Error reading database:', e);
}
