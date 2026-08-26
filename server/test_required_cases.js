import aiService from './services/ai.service.js';

async function runRequiredTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING 8 REQUIRED USER TEST CASES (REAL DATA ONLY)');
  console.log('================================================================\n');

  const testCases = [
    {
      id: 1,
      name: '1. "hi"',
      query: 'hi',
      lang: 'en',
      validate: (res) => {
        const lower = (res.answer || '').toLowerCase();
        return (
          res.success === true &&
          (lower.includes('hello') || lower.includes('hi') || lower.includes('welcome') || lower.includes('assistant')) &&
          !lower.includes('sorry, i don\'t have') &&
          !lower.includes('unavailable')
        );
      },
      expectedDescription: 'Normal conversational greeting without database query'
    },
    {
      id: 2,
      name: '2. "how are you?"',
      query: 'how are you?',
      lang: 'en',
      validate: (res) => {
        const lower = (res.answer || '').toLowerCase();
        return (
          res.success === true &&
          (lower.includes('doing') || lower.includes('well') || lower.includes('good') || lower.includes('ready') || lower.includes('help')) &&
          !lower.includes('sorry, i don\'t have') &&
          !lower.includes('unavailable')
        );
      },
      expectedDescription: 'Normal conversational status response'
    },
    {
      id: 3,
      name: '3. "thank you"',
      query: 'thank you',
      lang: 'en',
      validate: (res) => {
        const lower = (res.answer || '').toLowerCase();
        return (
          res.success === true &&
          (lower.includes('welcome') || lower.includes('glad') || lower.includes('pleasure') || lower.includes('anytime')) &&
          !lower.includes('sorry, i don\'t have') &&
          !lower.includes('unavailable')
        );
      },
      expectedDescription: 'Normal polite acknowledgment'
    },
    {
      id: 4,
      name: '4. "What projects are running?"',
      query: 'What projects are running?',
      lang: 'en',
      validate: (res) => {
        const ans = res.answer || '';
        // Real projects in projects.geojson / database
        return (
          res.success === true &&
          (ans.includes('PRJ-2026') || ans.includes('Godavari') || ans.includes('Tilak Road') || ans.includes('SCADA') || ans.includes('Subhash Road')) &&
          !ans.includes('Sorry, I don\'t have')
        );
      },
      expectedDescription: 'Real project records from projects.geojson / database'
    },
    {
      id: 5,
      name: '5. "Show projects near Ward 4"',
      query: 'Show projects near Ward 4',
      lang: 'en',
      validate: (res) => {
        const ans = res.answer || '';
        // Real Ward 4 project
        return (
          res.success === true &&
          (ans.includes('Yesgaon') || ans.includes('PRJ-2026-005') || ans.includes('Logistics')) &&
          !ans.includes('Sorry, I don\'t have')
        );
      },
      expectedDescription: 'Real Ward 4 project records (PRJ-2026-005 Yesgaon Logistics)'
    },
    {
      id: 6,
      name: '6. "Water supply schedule in Ward 4"',
      query: 'Water supply schedule in Ward 4',
      lang: 'en',
      validate: (res) => {
        // Since no water supply schedule exists in the DB, it must return UNAVAILABLE / fallback
        return res.success === false && res.answer === 'UNAVAILABLE';
      },
      expectedDescription: 'Authentic fallback (UNAVAILABLE) since water schedule table does not exist in DB'
    },
    {
      id: 7,
      name: '7. "Show complaints near Station Road"',
      query: 'Show complaints near Station Road',
      lang: 'en',
      validate: (res) => {
        const ans = res.answer || '';
        // Real complaint on Station Road (CMP-2026-8902)
        return (
          res.success === true &&
          (ans.includes('Station Road') || ans.includes('CMP-2026-8902') || ans.includes('Water Leakage') || ans.includes('Pipeline')) &&
          !ans.includes('Sorry, I don\'t have')
        );
      },
      expectedDescription: 'Real complaint data from database for Station Road (CMP-2026-8902)'
    },
    {
      id: 8,
      name: '8. "Show spaceports in Ward 99"',
      query: 'Show spaceports in Ward 99',
      lang: 'en',
      validate: (res) => {
        return res.success === false && res.answer === 'UNAVAILABLE';
      },
      expectedDescription: 'Authentic database fallback (UNAVAILABLE) for non-existent civic information'
    }
  ];

  let passed = 0;

  for (const tc of testCases) {
    console.log(`----------------------------------------------------------------`);
    console.log(`Test ${tc.id}: ${tc.name}`);
    console.log(`Expected: ${tc.expectedDescription}`);

    const res = await aiService.processPlannerQuery(tc.query, tc.lang);
    console.log(`Success: ${res.success}`);
    console.log(`Answer:\n${res.answer}\n`);

    const isValid = tc.validate(res);
    if (isValid) {
      console.log(`✅ Result: PASSED`);
      passed++;
    } else {
      console.error(`❌ Result: FAILED`);
    }
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL RESULT: ${passed} / ${testCases.length} TESTS PASSED`);
  console.log('================================================================\n');

  process.exit(passed === testCases.length ? 0 : 1);
}

runRequiredTests();
