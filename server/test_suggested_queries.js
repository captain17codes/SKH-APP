import aiService from './services/ai.service.js';

const ALL_FRONTEND_SUGGESTED_QUERIES = [
  // AiPlannerPage.jsx suggestions
  "What is the population of Kopargaon?",
  "Which ward needs the most development?",
  "Which wards have water supply problems?",
  "Which ward has the most complaints?",
  "How many streetlights are mapped?",
  "How many smart city projects are active?",

  // Business & Citizen suggestions
  "Where should commercial development be encouraged?",
  "Which ward has the highest population?",
  "What is the solar potential of Kopargaon?",
  "Where is mixed-use development suitable?",

  // Multilingual suggestions
  "कोपरगावची एकूण लोकसंख्या किती आहे?",
  "कोपरगांव की कुल जनसंख्या कितनी है?"
];

async function verifyAllSuggestedQueries() {
  console.log('🚀 Running Suggested Query Verification Test Suite...\n');
  let passCount = 0;

  for (let i = 0; i < ALL_FRONTEND_SUGGESTED_QUERIES.length; i++) {
    const query = ALL_FRONTEND_SUGGESTED_QUERIES[i];
    console.log(`------------------------------------------------------------`);
    console.log(`🧪 Suggested Query ${i + 1}: "${query}"`);

    try {
      const res = await aiService.processPlannerQuery(query, 'auto', 'citizen');
      const answer = res.answer || res.response || res.text || '';
      const sources = res.sources || [];

      console.log(`📤 Answer:\n${answer}`);
      console.log(`🏷️ Sources:`, sources);

      const isRefusal = answer.includes('sufficient information') || answer.includes('डेटासेटमध्ये');
      const hasSource = sources.some(s => s.includes('CSV Dataset') || s.includes('Knowledge Base'));

      if (!isRefusal && answer.length > 10 && hasSource) {
        console.log(`✅ [PASS] Successfully answered directly from CSV knowledge base.`);
        passCount++;
      } else {
        console.log(`❌ [FAIL] Missing CSV record or received refusal.`);
      }
    } catch (e) {
      console.error(`❌ [ERROR]:`, e.message);
    }
  }

  console.log(`\n============================================================`);
  console.log(`🎉 Suggested Query Verification: ${passCount} / ${ALL_FRONTEND_SUGGESTED_QUERIES.length} Passed Successfully!`);
  console.log(`============================================================\n`);
}

verifyAllSuggestedQueries();
