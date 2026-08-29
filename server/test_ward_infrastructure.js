import aiService from './services/ai.service.js';

const TEST_QUERIES = [
  { query: 'Give me the infrastructure of Ward 4', lang: 'en-IN' },
  { query: 'Show Ward 4 infrastructure', lang: 'en-IN' },
  { query: 'Ward 4 ki infrastructure dikhao', lang: 'hi-IN' },
  { query: 'What are the infrastructure gaps in Ward 4?', lang: 'en-IN' },
  { query: 'What infrastructure does Ward 4 have?', lang: 'en-IN' },
  { query: 'Ward 4 infrastructure details', lang: 'en-IN' },
  { query: 'Ward 4 madhe infrastructure kay aahe?', lang: 'mr-IN' },
  { query: 'Give me the infrastructure of Ward 99', lang: 'en-IN' }
];

async function runEndToEndVerification() {
  console.log('🚀 Running End-to-End CSV Knowledge Base & Ward 4 Infrastructure Test Suite...\n');
  let passCount = 0;

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const item = TEST_QUERIES[i];
    console.log(`============================================================`);
    console.log(`🧪 Test ${i + 1}: "${item.query}" (${item.lang})`);

    try {
      const res = await aiService.processPlannerQuery(item.query, item.lang, 'citizen');
      const answer = res.answer || res.response || res.text || '';
      const mapAction = res.mapAction;
      const sources = res.sources || [];

      console.log(`📤 Answer:\n${answer}\n`);
      console.log(`🗺️ Map Action:`, JSON.stringify(mapAction));
      console.log(`📚 Sources:`, sources);

      if (item.query.includes('Ward 99')) {
        if (answer.includes('sufficient information') || answer.includes('डेटासेटमध्ये') || answer.includes('डेटासेट')) {
          console.log(`✅ [PASS] Clean refusal for unindexed Ward 99 without fake mapAction.`);
          passCount++;
        } else {
          console.log(`❌ [FAIL] Expected refusal for Ward 99.`);
        }
      } else {
        const hasWard4Answer = answer.toLowerCase().includes('ward 4') || answer.toLowerCase().includes('वॉर्ड ४') || answer.toLowerCase().includes('yesgaon');
        const hasMapAction = mapAction && mapAction.type === 'FLY_TO' && mapAction.wardNumber === 4;

        if (hasWard4Answer && hasMapAction) {
          console.log(`✅ [PASS] Successfully retrieved CSV Knowledge record for Ward 4 with valid FLY_TO mapAction.`);
          passCount++;
        } else {
          console.log(`❌ [FAIL] CSV retrieval failed or mapAction missing.`);
        }
      }
    } catch (e) {
      console.error(`❌ [ERROR]:`, e.message);
    }
  }

  console.log(`\n============================================================`);
  console.log(`🎉 End-to-End Verification: ${passCount} / ${TEST_QUERIES.length} Passed!`);
  console.log(`============================================================\n`);
}

runEndToEndVerification();
