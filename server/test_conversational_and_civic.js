import aiService, { detectPlannerIntent, detectLanguageFromText } from './services/ai.service.js';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING KOPARGAON AI CITIZEN ASSISTANT VERIFICATION SUITE');
  console.log('================================================================\n');

  const testCases = [
    {
      name: "1. English Greeting: 'hi'",
      query: "hi",
      lang: "en",
      expectedType: "CONVERSATIONAL_GREETING",
      mustNotInclude: ["Sorry, I don't have this information", "UNAVAILABLE", "database"],
      mustInclude: ["Hello", "Kopargaon Smart City AI Citizen Assistant"]
    },
    {
      name: "2. English Chat: 'how are you'",
      query: "how are you",
      lang: "en",
      expectedType: "CONVERSATIONAL_HOW_ARE_YOU",
      mustNotInclude: ["Sorry, I don't have this information", "UNAVAILABLE", "database"],
      mustInclude: ["doing very well", "24/7"]
    },
    {
      name: "3. English Gratitude: 'thank you'",
      query: "thank you",
      lang: "en",
      expectedType: "CONVERSATIONAL_THANKS",
      mustNotInclude: ["Sorry, I don't have this information", "UNAVAILABLE", "database"],
      mustInclude: ["welcome", "help"]
    },
    {
      name: "4. English Water Schedule: 'Ward 4 water supply schedule'",
      query: "Ward 4 water supply schedule",
      lang: "en",
      expectedType: "CIVIC_WATER_SCHEDULE",
      mustNotInclude: ["Sorry, I don't have this information"],
      mustInclude: ["WATER SUPPLY SCHEDULE", "06:30 AM", "05:00 PM", "Amrut Jal Yojana"]
    },
    {
      name: "5. English Projects: 'show projects near Ward 4'",
      query: "show projects near Ward 4",
      lang: "en",
      expectedType: "CIVIC_PROJECTS",
      mustNotInclude: ["Sorry, I don't have this information"],
      mustInclude: ["PROJECTS DIRECTORY", "Ward 4"]
    },
    {
      name: "6. English Unavailable Civic: 'random unavailable civic information in Ward 99 space station'",
      query: "random unavailable civic information in Ward 99 space station",
      lang: "en",
      expectedType: "DATABASE_FALLBACK",
      mustInclude: ["UNAVAILABLE"]
    },
    {
      name: "7. Marathi Greeting: 'नमस्कार'",
      query: "नमस्कार",
      lang: "mr",
      expectedType: "MARATHI_GREETING",
      mustNotInclude: ["माहिती माझ्या Smart City", "UNAVAILABLE"],
      mustInclude: ["नमस्कार", "कोपरगाव स्मार्ट सिटी"]
    },
    {
      name: "8. Marathi Chat: 'कसे आहात'",
      query: "कसे आहात",
      lang: "mr",
      expectedType: "MARATHI_HOW_ARE_YOU",
      mustNotInclude: ["माहिती माझ्या Smart City", "UNAVAILABLE"],
      mustInclude: ["मजेत", "२४ तास"]
    },
    {
      name: "9. Marathi Gratitude: 'धन्यवाद'",
      query: "धन्यवाद",
      lang: "mr",
      expectedType: "MARATHI_THANKS",
      mustNotInclude: ["माहिती माझ्या Smart City", "UNAVAILABLE"],
      mustInclude: ["स्वागत", "आनंद"]
    },
    {
      name: "10. Marathi Water Schedule: 'वॉर्ड ४ पाणीपुरवठा वेळापत्रक'",
      query: "वॉर्ड ४ पाणीपुरवठा वेळापत्रक",
      lang: "mr",
      expectedType: "MARATHI_WATER_SCHEDULE",
      mustNotInclude: ["माहिती माझ्या Smart City"],
      mustInclude: ["पाणीपुरवठा वेळापत्रक", "सकाळचे सत्र", "06:30 AM"]
    },
    {
      name: "11. Hindi Greeting: 'नमस्ते'",
      query: "नमस्ते",
      lang: "hi",
      expectedType: "HINDI_GREETING",
      mustNotInclude: ["डेटाबेस में उपलब्ध नहीं", "UNAVAILABLE"],
      mustInclude: ["नमस्ते", "कोपरगांव स्मार्ट सिटी"]
    },
    {
      name: "12. Hindi Water Schedule: 'वार्ड 4 पानी की आपूर्ति का समय'",
      query: "वार्ड 4 पानी की आपूर्ति का समय",
      lang: "hi",
      expectedType: "HINDI_WATER_SCHEDULE",
      mustNotInclude: ["डेटाबेस में उपलब्ध नहीं"],
      mustInclude: ["जल आपूर्ति समय सारणी", "सुबह का सत्र", "06:30 AM"]
    }
  ];

  let passedCount = 0;

  for (const tc of testCases) {
    console.log(`----------------------------------------------------------------`);
    console.log(`Test: ${tc.name}`);
    console.log(`Input: "${tc.query}" [Lang: ${tc.lang}]`);

    const intent = detectPlannerIntent(tc.query, tc.lang);
    console.log(`Intent Detected: ${intent.intent}, Lang: ${intent.detectedLang}`);

    const res = await aiService.processPlannerQuery(tc.query, tc.lang);
    console.log(`Success: ${res.success}`);
    console.log(`Answer:\n${res.answer}`);

    let passed = true;

    if (tc.mustInclude) {
      for (const str of tc.mustInclude) {
        if (!res.answer || !res.answer.toLowerCase().includes(str.toLowerCase())) {
          console.error(`❌ FAILED: Expected answer to include "${str}"`);
          passed = false;
        }
      }
    }

    if (tc.mustNotInclude) {
      for (const str of tc.mustNotInclude) {
        if (res.answer && res.answer.toLowerCase().includes(str.toLowerCase())) {
          console.error(`❌ FAILED: Expected answer NOT to include "${str}"`);
          passed = false;
        }
      }
    }

    if (passed) {
      console.log(`✅ PASSED`);
      passedCount++;
    } else {
      console.log(`❌ FAILED`);
    }
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL RESULT: ${passedCount} / ${testCases.length} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedCount === testCases.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
