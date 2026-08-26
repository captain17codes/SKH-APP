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
    const parsed = JSON.parse(row.data);
    console.log('Keys in execution data:', Object.keys(parsed));
    
    // Check webhook response or final node output
    if (parsed.resultData && parsed.resultData.runData) {
      const runData = parsed.resultData.runData;
      console.log('Nodes run in workflow:', Object.keys(runData));
      
      // Print the output of the Respond to Webhook or JSON Formatter node
      const webhookResponseNode = runData['Respond to Webhook'] || runData['JSON Formatter'];
      if (webhookResponseNode && webhookResponseNode[0]) {
        console.log('Final Node Output Data:', JSON.stringify(webhookResponseNode[0].data, null, 2));
      }
    }
  } else {
    console.log('No execution data found.');
  }
} catch (e) {
  console.error('Error reading database:', e);
}
