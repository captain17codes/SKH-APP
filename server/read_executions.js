import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.homedir(), '.n8n', 'database.sqlite');
console.log('Opening database:', dbPath);

try {
  const db = new DatabaseSync(dbPath);
  const query = db.prepare("SELECT executionId, workflowVersionId FROM execution_data LIMIT 5");
  console.log('Executions in execution_data:', query.all());
} catch (e) {
  console.error('Error reading database:', e);
}
