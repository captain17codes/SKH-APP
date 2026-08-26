import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.homedir(), '.n8n', 'database.sqlite');
console.log('Opening database:', dbPath);

try {
  const db = new DatabaseSync(dbPath);
  
  // Update user activation
  const stmt = db.prepare("UPDATE user SET settings = '{\"userActivated\":true}'");
  const result = stmt.run();
  console.log('Update result:', result);
  
  // Verify
  const query = db.prepare("SELECT id, email, settings FROM user");
  console.log('Users status in DB:', query.all());
} catch (e) {
  console.error('Error activating user:', e);
}
