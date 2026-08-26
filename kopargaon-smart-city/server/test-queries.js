import { aiService } from './services/ai.service.js';

const queries = [
  { text: 'hi', lang: 'en-IN' },
  { text: 'Where is Ward 4 infrastructure project?', lang: 'en-IN' },
  { text: 'Which projects need immediate attention?', lang: 'en-IN' },
  { text: 'Show hospital recommendations in Ward 3.', lang: 'en-IN' },
  { text: 'मला कोपरगावमधील रुग्णालयासाठी योग्य जागा शोधा', lang: 'mr-IN' },
  { text: 'मुझे वार्ड 4 की सड़क परियोजना के बारे में बताओ', lang: 'hi-IN' }
];

async function runTests() {
  for (const q of queries) {
    console.log(`\n--- Testing query: "${q.text}" (${q.lang}) ---`);
    try {
      const result = await aiService.processPlannerQuery(q.text, q.lang, 'administrator');
      console.log('Result Success:', result.success);
      console.log('Result Answer Length:', result.answer ? result.answer.length : 0);
      console.log('Result First 100 chars of Answer:', result.answer ? result.answer.substring(0, 100) : 'N/A');
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

runTests();
