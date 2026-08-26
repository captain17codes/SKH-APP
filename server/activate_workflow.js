import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.homedir(), '.n8n', 'database.sqlite');
console.log('Opening database:', dbPath);

try {
  const db = new DatabaseSync(dbPath);
  
  // Get current versionId
  const getStmt = db.prepare("SELECT versionId FROM workflow_entity WHERE id = ?");
  const row = getStmt.get('kopargaon-ai-workflow');
  console.log('Current versionId:', row);

  if (row && row.versionId) {
    // Update active, activeVersionId and triggerCount
    const updateStmt = db.prepare(
      "UPDATE workflow_entity SET active = 1, activeVersionId = ?, triggerCount = 1 WHERE id = ?"
    );
    const result = updateStmt.run(row.versionId, 'kopargaon-ai-workflow');
    console.log('Update result:', result);
  } else {
    console.error('Workflow not found or missing versionId');
  }

  // Verify
  const query = db.prepare("SELECT id, name, active, triggerCount, activeVersionId FROM workflow_entity WHERE id = ?");
  console.log('Workflow status in DB:', query.get('kopargaon-ai-workflow'));
} catch (e) {
  console.error('Error activating workflow:', e);
}
