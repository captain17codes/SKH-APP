import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api/ai/urban-planner';

async function testQuery(query, language, role) {
  console.log(`\n======================================================`);
  console.log(`TESTING: Role="${role}", Language="${language}"`);
  console.log(`Query: "${query}"`);
  console.log(`======================================================`);
  
  try {
    const response = await axios.post(BACKEND_URL, {
      query,
      language,
      role
    }, { timeout: 20000 }); // n8n has a 15s timeout, so wait 20s

    const data = response.data;
    console.log(`Response Status: ${response.status}`);
    console.log(`Response JSON Keys: ${JSON.stringify(Object.keys(data))}`);
    
    // Validate schema
    const schemaOk = 
      data.success !== undefined &&
      typeof data.answer === 'string' &&
      Array.isArray(data.recommendations) &&
      (data.mapAction === null || typeof data.mapAction === 'object') &&
      Array.isArray(data.sources);

    if (schemaOk) {
      console.log('✅ SCHEMA VALIDATION: PASSED');
    } else {
      console.error('❌ SCHEMA VALIDATION: FAILED');
      console.error(JSON.stringify(data, null, 2));
    }

    console.log(`\nAnswer Snippet:\n${data.answer.substring(0, 300)}...`);
    console.log(`\nRecommendations Count: ${data.recommendations.length}`);
    console.log(`MapAction: ${JSON.stringify(data.mapAction)}`);
    console.log(`Sources: ${JSON.stringify(data.sources)}`);
    
    return schemaOk;
  } catch (err) {
    console.error(`❌ TEST FAILED: ${err.message}`);
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(`Data:`, err.response.data);
    }
    return false;
  }
}

async function runAll() {
  console.log('🚀 Starting end-to-end integration tests...');
  
  // Test 1: Administrator
  const adminOk = await testQuery(
    'Where should a new hospital be built in Ward 4?',
    'en-IN',
    'administrator'
  );
  
  // Test 2: Citizen (Marathi)
  const citizenOk = await testQuery(
    'रस्ता दुरुस्ती बद्दल काय चालू आहे?',
    'mr-IN',
    'citizen'
  );

  // Test 3: Business (Hindi)
  const businessOk = await testQuery(
    'स्टेशन रोड पर व्यापार के क्या अवसर हैं?',
    'hi-IN',
    'business'
  );

  console.log(`\n======================================================`);
  console.log('TEST SUMMARY:');
  console.log(`Administrator (Admin UI / en-IN): ${adminOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Citizen (Citizen UI / mr-IN): ${citizenOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Business (Business UI / hi-IN): ${businessOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`======================================================`);
  
  if (adminOk && citizenOk && businessOk) {
    console.log('🎉 All integration tests passed successfully!');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed. Please review the output.');
    process.exit(1);
  }
}

runAll();
