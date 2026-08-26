import fs from 'fs';

try {
  const data = JSON.parse(fs.readFileSync('../n8n-nodes-list.json', 'utf8'));
  console.log('Sample node keys:', Object.keys(data[0]));
  console.log('Sample node details:', JSON.stringify(data[0], null, 2));
} catch (e) {
  console.error(e);
}
