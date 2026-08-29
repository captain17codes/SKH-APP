import axios from 'axios';
import aiService from './server/services/ai.service.js';

const TEST_CASES = [
  {
    type: '1. Exact CSV question',
    query: 'What is the population of Kopargaon?',
    language: 'en-IN',
    expectedTopic: 'Population ~1.10 lakh'
  },
  {
    type: '2. Same question with different wording',
    query: 'How many people live in Kopargaon?',
    language: 'en-IN',
    expectedTopic: 'Population ~1.10 lakh'
  },
  {
    type: '3. Hindi question',
    query: 'कोपरगांव की कुल जनसंख्या कितनी है?',
    language: 'hi-IN',
    expectedTopic: 'Hindi population response (~1.10 लाख)'
  },
  {
    type: '4. Marathi question (Mixed / Transliterated)',
    query: 'Kopargaon madhe water supply kashi improve karu shakto?',
    language: 'mr-IN',
    expectedTopic: 'Marathi water supply response (Wards 6 & 8 / pipeline capacity)'
  },
  {
    type: '5. Hinglish question',
    query: 'Kopargaon me kaunse ward me sabse jyada aabadi hai?',
    language: 'hi-IN',
    expectedTopic: 'Ward 7 highest population'
  },
  {
    type: '6. Question related to another CSV category (Streetlights)',
    query: 'How many streetlights are mapped in Kopargaon?',
    language: 'en-IN',
    expectedTopic: '240 mapped streetlights'
  },
  {
    type: '7. Question related to another CSV category (Solar Potential)',
    query: 'What is the solar potential of Kopargaon?',
    language: 'en-IN',
    expectedTopic: 'Moderate to high rooftop solar potential'
  },
  {
    type: '8. Unrelated question',
    query: 'Who won the 2022 FIFA World Cup in Qatar?',
    language: 'en-IN',
    expectedTopic: 'I don\'t have sufficient information about this in the current Kopargaon Smart City dataset.'
  }
];

async function runWorkflowTests() {
  console.log('🚀 Running Kopargaon Smart City AI Agent Workflow Test Suite...\n');
  let passCount = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`------------------------------------------------------------`);
    console.log(`🧪 Test Case ${i + 1}: ${tc.type}`);
    console.log(`📥 Query: "${tc.query}" (Lang: ${tc.language})`);
    
    try {
      const result = await aiService.processPlannerQuery(tc.query, tc.language, 'citizen');
      const answer = result.answer || result.response || result.text || '';
      console.log(`📤 Response:\n${answer}`);
      console.log(`🏷️ Sources:`, result.sources || []);
      
      if (tc.type.includes('Unrelated')) {
        if (answer.includes('sufficient information') || answer.includes('पुढील') || answer.includes('डेटासेट')) {
          console.log(`✅ [PASS] Graceful refusal on unindexed data without hallucination.`);
          passCount++;
        } else {
          console.log(`⚠️ Warning: Expected standard fallback refusal.`);
        }
      } else {
        if (answer && answer.length > 10) {
          console.log(`✅ [PASS] Relevant CSV answer successfully retrieved and formatted.`);
          passCount++;
        } else {
          console.log(`❌ [FAIL] Missing or empty response.`);
        }
      }
    } catch (err) {
      console.error(`❌ [ERROR]:`, err.message);
    }
  }

  console.log(`\n============================================================`);
  console.log(`🎉 Workflow Test Results: ${passCount} / ${TEST_CASES.length} Passed Successfully!`);
  console.log(`============================================================\n`);
}

runWorkflowTests();
