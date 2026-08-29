import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';

const dbPath = 'C:/Users/chava/.n8n/database.sqlite';
if (fs.existsSync(dbPath)) {
  const db = new DatabaseSync(dbPath);
  const workflowJson = JSON.parse(fs.readFileSync('n8n-workflow.json', 'utf8'));
  const stmt = db.prepare("UPDATE workflow_entity SET nodes = ?, connections = ?, active = 1, updatedAt = datetime('now') WHERE id = ?");
  stmt.run(JSON.stringify(workflowJson.nodes), JSON.stringify(workflowJson.connections), 'kopargaon-ai-workflow');
  console.log('✅ n8n sqlite database updated successfully for workflow kopargaon-ai-workflow (nodes & connections)');
}
