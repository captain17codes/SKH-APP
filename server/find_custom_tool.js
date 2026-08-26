import fs from 'fs';

try {
  const data = JSON.parse(fs.readFileSync('../n8n-nodes-list.json', 'utf8'));
  const results = data.filter(node => 
    node.name && node.name.includes('n8n-nodes-langchain') && node.name.toLowerCase().includes('tool')
  );

  console.log(`Found ${results.length} LangChain tool nodes:`);
  results.forEach(node => {
    console.log(`- DisplayName: "${node.displayName}", Name: "${node.name}"`);
  });
} catch (e) {
  console.error(e);
}
