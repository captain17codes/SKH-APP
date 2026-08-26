import axios from 'axios';
import dotenv from 'dotenv';
import mcpClient from './mcpClient.js';

dotenv.config();

const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = process.env.GROK_MODEL || 'grok-4.5';

// Language name mapping
const LANG_NAMES = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi'
};

// Supported Urban Planning Intents
export const INTENTS = {
  HOSPITAL_LOCATION: 'HOSPITAL_LOCATION',
  SCHOOL_LOCATION: 'SCHOOL_LOCATION',
  INFRASTRUCTURE_GAPS: 'INFRASTRUCTURE_GAPS',
  WATER_DRAINAGE: 'WATER_DRAINAGE',
  ROADS_TRANSPORT: 'ROADS_TRANSPORT',
  ONGOING_PROJECTS: 'ONGOING_PROJECTS',
  DELAYED_HIGH_RISK_PROJECTS: 'DELAYED_HIGH_RISK_PROJECTS',
  PROJECT_SPECIFIC: 'PROJECT_SPECIFIC',
  GENERAL_PLANNING: 'GENERAL_PLANNING'
};

// Auto-detect language from text using script & word analysis
export const detectLanguageFromText = (text) => {
  if (!text || !text.trim()) return 'en-IN';
  
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const lowerText = text.toLowerCase();

  if (devanagariCount > 0) {
    const marathiWords = [
      'मला', 'मराठी', 'कोपरगाव', 'रुग्णालय', 'दवाखाना', 'रस्ता',
      'रस्ते', 'पाणी', 'शाळा', 'प्रकल्प', 'तक्रार', 'सुविधा',
      'पायाभूत', 'नगरपालिका', 'कुठे', 'किती', 'आहे', 'द्या', 'शोधा'
    ];
    const hindiWords = [
      'मुझे', 'हिंदी', 'कोपरगांव', 'अस्पताल', 'सड़क',
      'सड़कें', 'सड़कों', 'पानी', 'स्कूल', 'परियोजना', 'शिकायत',
      'सुविधा', 'बुनियादी', 'नगरपालिका', 'कहाँ', 'कितना', 'है',
      'बताओ', 'खोजो'
    ];
    
    let marathiScore = 0;
    let hindiScore = 0;
    marathiWords.forEach(word => {
      if (text.includes(word)) marathiScore++;
    });
    hindiWords.forEach(word => {
      if (text.includes(word)) hindiScore++;
    });
    
    if (marathiScore > hindiScore) return 'mr-IN';
    if (hindiScore > marathiScore) return 'hi-IN';
    if (text.includes('ळ') || text.includes('चा') || text.includes('ची') || text.includes('चे') || text.includes('ून')) {
      return 'mr-IN';
    }
    return 'mr-IN'; // Default Devanagari script to Marathi
  }

  // Transliteration logic
  const marathiTrans = ['mala', 'marathi', 'kopargaon', 'hospital', 'shala', 'pani', 'rasta', 'prakalp', 'suvidha', 'ahe', 'shodh', 'dya', 'sang', 'naveen', 'bola'];
  const hindiTrans = ['mujhe', 'chahiye', 'kahan', 'batao', 'dikhao', 'paani', 'sadak', 'project', 'hai'];
  
  let mTransScore = 0;
  let hTransScore = 0;
  marathiTrans.forEach(w => {
    const reg = new RegExp('\\b' + w + '\\b', 'i');
    if (reg.test(lowerText)) mTransScore++;
  });
  hindiTrans.forEach(w => {
    const reg = new RegExp('\\b' + w + '\\b', 'i');
    if (reg.test(lowerText)) hTransScore++;
  });
  
  if (mTransScore > hTransScore) return 'mr-IN';
  if (hTransScore > mTransScore) return 'hi-IN';

  return 'en-IN';
};

// Auto-detect language and intent from natural language query
export const detectPlannerIntent = (query, inputLanguage = null) => {
  const q = (query || '').trim();
  const lower = q.toLowerCase();

  // 1. Language Detection via helper
  let detectedLang = inputLanguage;
  if (!detectedLang || detectedLang === 'auto' || detectedLang === 'en-IN') {
    detectedLang = detectLanguageFromText(q);
  }


  // 2. Extract Ward ID if present
  let wardId = null;
  const wardMatch = lower.match(/w[1-6]/i) || lower.match(/ward\s*[1-6]/i) || q.match(/वॉर्ड\s*[१-६1-6]/);
  if (wardMatch) {
    const num = wardMatch[0].match(/[1-6१-६]/)[0];
    const devToEngNum = { '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6' };
    const normNum = devToEngNum[num] || num;
    wardId = `W${normNum}`;
  }

  // 3. Extract Project ID if present (e.g., PRJ-2026-002)
  const prjMatch = lower.match(/prj-[0-9a-z-]+/i) || lower.match(/prj-[0-9]+/i);
  const projectId = prjMatch ? prjMatch[0].toUpperCase() : null;

  // 4. Intent Classification Rules (supporting Marathi, Hindi, English, Devanagari & transliterated mix)

  // A. Hospital / Health Facility Location
  if (
    lower.includes('hospital') || lower.includes('health') || lower.includes('medical') || lower.includes('clinic') ||
    lower.includes('हॉस्पिटल') || lower.includes('रुग्णालय') || lower.includes('दवाखाना') || lower.includes('अस्पताल') || lower.includes('आरोग्य')
  ) {
    return { intent: INTENTS.HOSPITAL_LOCATION, detectedLang, wardId: wardId || 'W4', projectId };
  }

  // B. School / Education Facility Location
  if (
    lower.includes('school') || lower.includes('education') || lower.includes('college') ||
    lower.includes('शाळा') || lower.includes('विद्यालय') || lower.includes('शिक्षण') || lower.includes('कॉलेज') || lower.includes('प्राथमिक')
  ) {
    return { intent: INTENTS.SCHOOL_LOCATION, detectedLang, wardId: wardId || 'W4', projectId };
  }

  // C. Water / Drainage Problems
  if (
    lower.includes('water') || lower.includes('drainage') || lower.includes('sewer') || lower.includes('leak') || lower.includes('pipeline') ||
    lower.includes('पाणी') || lower.includes('पाण्याची') || lower.includes('ड्रेनेज') || lower.includes('सांडपाणी') || lower.includes('गळती') || lower.includes('जल') || lower.includes('नल')
  ) {
    return { intent: INTENTS.WATER_DRAINAGE, detectedLang, wardId: wardId || 'W4', projectId };
  }

  // D. Roads / Transport
  if (
    lower.includes('road') || lower.includes('transport') || lower.includes('traffic') || lower.includes('highway') || lower.includes('street') || lower.includes('pothole') ||
    lower.includes('रस्ता') || lower.includes('रस्ते') || lower.includes('वाहतूक') || lower.includes('सड़क') || lower.includes('मार्ग') || lower.includes('डांबरीकरण')
  ) {
    return { intent: INTENTS.ROADS_TRANSPORT, detectedLang, wardId: wardId || 'W4', projectId };
  }

  // E. Project Specific Analysis
  if (
    projectId || lower.includes('analyze project') || lower.includes('why is') ||
    lower.includes('विलंब') || lower.includes('उशीर')
  ) {
    return { intent: INTENTS.PROJECT_SPECIFIC, detectedLang, wardId: wardId || 'W4', projectId: projectId || 'PRJ-2026-002' };
  }

  // F. Delayed / High Risk Projects / Immediate Attention
  if (
    lower.includes('immediate attention') || lower.includes('at risk') || lower.includes('delayed') || lower.includes('high risk') || lower.includes('urgent') ||
    lower.includes('तातडी') || lower.includes('धोका') || lower.includes('प्रलंबित') || lower.includes('तत्काल') || lower.includes('लक्ष')
  ) {
    return { intent: INTENTS.DELAYED_HIGH_RISK_PROJECTS, detectedLang, wardId: wardId || 'W4', projectId };
  }

  // G. Ongoing Projects / Portfolio
  if (
    lower.includes('ongoing') || lower.includes('active project') || lower.includes('current project') || lower.includes('portfolio') ||
    lower.includes('चालू') || lower.includes('सुरू') || lower.includes('प्रकल्प') || lower.includes('योजना') || lower.includes('प्रोजेक्ट')
  ) {
    return { intent: INTENTS.ONGOING_PROJECTS, detectedLang, wardId, projectId };
  }

  // H. Infrastructure Gaps
  if (
    lower.includes('gap') || lower.includes('lacking') || lower.includes('infrastructure') || lower.includes('shortage') ||
    lower.includes('तूट') || lower.includes('कमतरता') || lower.includes('सुविधा') || lower.includes('पायाभूत') || lower.includes('बुनियादी')
  ) {
    return { intent: INTENTS.INFRASTRUCTURE_GAPS, detectedLang, wardId: wardId || 'W4', projectId };
  }

  // I. General Urban Planning Questions (Catch-all)
  return { intent: INTENTS.GENERAL_PLANNING, detectedLang, wardId: wardId || 'W4', projectId };
};

// Helper to query Grok 4.5 using standard xAI chat completions JSON-mode
const callGrok = async (systemInstruction, prompt) => {
  if (!GROK_API_KEY) {
    throw new Error('GROK_API_KEY is not configured');
  }

  try {
    const response = await axios.post(GROK_API_URL, {
      model: GROK_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const contentText = response.data?.choices?.[0]?.message?.content;
    return contentText ? JSON.parse(contentText) : null;
  } catch (e) {
    console.error('❌ Grok API execution failed:', e.message);
    if (e.response && e.response.data) {
      console.error('Grok Error Details:', JSON.stringify(e.response.data));
    }
    return null;
  }
};

const isCasualGreeting = (text) => {
  const q = (text || '')
    .toLowerCase()
    .trim()
    .replace(/[!?.,]+$/g, '');

  const greetings = [
    'hi',
    'hello',
    'hey',
    'hii',
    'hiii',
    'good morning',
    'good afternoon',
    'good evening',
    'namaste',
    'namaskar',
    'नमस्ते',
    'नमस्कार',
    'हाय',
    'हॅलो'
  ];

  return greetings.includes(q);
};

export const aiService = {
  processPlannerQuery: async (query, language, role = 'administrator', extraData = {}) => {
    let targetLang = language;
    if (!targetLang || targetLang === 'auto' || targetLang === 'en-IN') {
      targetLang = detectLanguageFromText(query);
    }

    if (isCasualGreeting(query)) {
      console.log(`[AI] Casual greeting detected. Skipping n8n/MCP pipeline.`);
      console.log(`[AI] Greeting language: ${targetLang}`);

      let greetingAnswer = 'Hello! 👋 I am the Kopargaon AI Urban Planner. I can help you with hospitals, schools, roads, water & drainage, infrastructure gaps, ongoing projects, and high-risk projects. What would you like to explore?';
      
      if (targetLang === 'hi-IN') {
        greetingAnswer = 'नमस्ते! 👋 मैं कोपरगांव AI अर्बन प्लानर हूँ। मैं अस्पताल, स्कूल, सड़क, पानी और ड्रेनेज, इंफ्रास्ट्रक्चर गैप, चालू परियोजनाओं और जोखिम वाली परियोजनाओं के बारे में जानकारी दे सकता हूँ। आप क्या जानना चाहते हैं?';
      } else if (targetLang === 'mr-IN') {
        greetingAnswer = 'नमस्कार! 👋 मी कोपरगाव AI अर्बन प्लॅनर आहे. मी रुग्णालये, शाळा, रस्ते, पाणी व ड्रेनेज, पायाभूत सुविधांची कमतरता, चालू प्रकल्प आणि जोखमीतील प्रकल्प याबद्दल माहिती देऊ शकतो. तुम्हाला काय जाणून घ्यायचे आहे?';
      }

      return {
        success: true,
        answer: greetingAnswer,
        recommendations: [],
        mapAction: null,
        sources: [],
        mcpToolUsed: null,
        mcpSuccess: true,
        conversational: true,
        language: targetLang
      };
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        console.log(`[AI] Forwarding query to n8n AI agent pipeline (${n8nWebhookUrl}) for role: ${role}`);
        const response = await axios.post(n8nWebhookUrl, {
          query,
          language: targetLang,
          role,
          userType: role,
          userId: extraData.userId || null,
          location: extraData.location || null,
          conversation: extraData.conversation || []
        }, { timeout: 15000 });

        if (response.data && (response.data.answer || response.data.output || response.data.text || (response.data.data && response.data.data.answer))) {
          console.log('[AI] Successfully retrieved response from n8n AI agent:', response.data);
          return response.data;
        }
      } catch (e) {
        console.warn(`[AI] n8n pipeline execution failed: ${e.message}. Falling back to local solver.`);
      }
    }

    const intentInfo = detectPlannerIntent(query, targetLang);
    const langName = LANG_NAMES[targetLang] || 'English';
    console.log(`[AI] Query received: "${query}" (Target Language: ${langName})`);
    console.log(`[AI] Language detected: ${intentInfo.detectedLang} (${langName})`);
    console.log(`[AI] Intent detected: ${intentInfo.intent}`);

    let mcpToolSelected = null;
    let mcpResult = null;
    let mcpError = null;

    // Check if Grok API key is provided and valid
    if (GROK_API_KEY && !GROK_API_KEY.includes('YOUR_KEY')) {
      try {
        const availableTools = await mcpClient.getTools();
        console.log(`[MCP] Discovered ${availableTools.length} MCP tools`);

        const selectionSysInstruction = 'You are a GIS router. Select appropriate tools to fulfill the user query. The user may communicate in Marathi, Hindi, or English. Understand the intent regardless of language. Return only a JSON object.';
        const selectionPrompt = `Given the user query: "${query}"
        Available Tools:
        ${JSON.stringify(availableTools)}
        
        Select the tools that must be executed to gather real GIS data.
        Return ONLY a JSON object formatted exactly as:
        {
          "toolCalls": [
            { "name": "tool_name", "arguments": { "arg1": "val1" } }
          ]
        }`;

        const selected = await callGrok(selectionSysInstruction, selectionPrompt);
        const toolCalls = selected?.toolCalls || [];
        
        if (toolCalls.length > 0) {
          mcpToolSelected = toolCalls.map(t => t.name).join(', ');
          console.log(`[AI] Selected MCP tool: ${mcpToolSelected}`);
        }

        const toolResults = await Promise.all(toolCalls.map(async (tc) => {
          try {
            const data = await mcpClient.callTool(tc.name, tc.arguments);
            return { tool: tc.name, success: true, data };
          } catch (err) {
            return { tool: tc.name, success: false, error: err.message };
          }
        }));

        const synthesisSysInstruction = "You are a helpful conversational AI Assistant for Kopargaon Smart City. You are talking directly to the user.\n" +
"CRITICAL CONVERSATIONAL RULES:\n" +
"1. Act like a real human assistant communicating directly with the user.\n" +
"2. DO NOT generate a report unless the user explicitly asks for a report, detailed analysis, or structured list.\n" +
"3. For normal questions, answer naturally and briefly (1-4 sentences).\n" +
"4. NEVER repeat the user's question.\n" +
"5. NEVER output system headers like \"Kopargaon AI Urban Planning Response\" or \"### GIS विश्लेषण\".\n" +
"6. NEVER use unnecessary markdown like headings (##, ###), bold (**), or structural labels like \"Response:\", \"Answer:\". Use normal sentences.\n" +
"7. If a list is genuinely necessary, use simple bullet points only.\n" +
"8. ALWAYS answer in " + langName + ". If the language is Marathi, respond in natural Marathi (Devanagari). If Hindi, respond in Hindi (Devanagari). If English, respond in English.\n" +
"9. Always end with ONE short helpful natural follow-up if applicable (e.g., \"Would you like me to show it on the map?\").";

        const synthesisPrompt = "Formulate a natural, conversational response for the user's query: \"" + query + "\".\n" +
        "Real data gathered from system:\n" +
        JSON.stringify(toolResults) + "\n\n" +
        "Return ONLY a JSON object formatted exactly as:\n" +
        "{\n" +
        "  \"success\": true,\n" +
        "  \"answer\": \"Your natural, brief, conversational answer in " + langName + " here...\",\n" +
        "  \"recommendations\": [\n" +
        "    {\n" +
        "      \"name\": \"Location Name\",\n" +
        "      \"latitude\": 19.883,\n" +
        "      \"longitude\": 74.488,\n" +
        "      \"score\": 91,\n" +
        "      \"reasons\": [ \"...\" ]\n" +
        "    }\n" +
        "  ],\n" +
        "  \"mapAction\": {\n" +
        "    \"type\": \"FLY_TO\",\n" +
        "    \"latitude\": 19.883,\n" +
        "    \"longitude\": 74.488,\n" +
        "    \"zoom\": 15\n" +
        "  },\n" +
        "  \"sources\": [ \"Database\" ]\n" +
        "}";

        const finalReport = await callGrok(synthesisSysInstruction, synthesisPrompt);
        if (finalReport) {
          console.log("[AI] Final response generated via Grok LLM");
          return finalReport;
        }
      } catch (e) {
        console.warn(`[AI] Grok API call failed or unavailable (${e.message}). Proceeding with intelligent deterministic intent processor.`);
      }
    } else {
      console.log(`[AI] GROK_API_KEY unconfigured/invalid. Executing deterministic MCP intent processor.`);
    }

    // Process via deterministic intent solver using MCP tools and spatial analysis
    const result = await aiService.fallbackPlanner(query, targetLang, intentInfo);
    console.log(`[AI] Selected MCP tool: ${result.mcpToolUsed || 'local_gis_solver'}`);
    console.log(`[AI] MCP result: ${result.mcpSuccess !== false ? 'SUCCESS' : 'ERROR'}`);
    console.log(`[AI] Final response generated`);
    return result;
  },

  fallbackPlanner: async (query, language, providedIntentInfo = null) => {
    let targetLang = language;
    if (!targetLang || targetLang === 'auto' || targetLang === 'en-IN') {
      targetLang = detectLanguageFromText(query);
    }
    const intentInfo = providedIntentInfo || detectPlannerIntent(query, targetLang);
    const wardId = intentInfo.wardId || 'W4';

    let mcpToolUsed = null;
    let mcpSuccess = true;
    let mcpResultData = null;

    // 1. HOSPITAL / HEALTH FACILITY LOCATION INTENT
    if (intentInfo.intent === INTENTS.HOSPITAL_LOCATION) {
      mcpToolUsed = 'find_suitable_locations';
      let candidates = [];
      try {
        candidates = await mcpClient.callTool('find_suitable_locations', { facilityType: 'hospital', wardId });
        mcpResultData = candidates;
      } catch (err) {
        mcpSuccess = false;
        console.error(`[MCP Error] ${mcpToolUsed}:`, err.message);
      }

      const top = (candidates && candidates.length > 0) ? candidates[0] : {
        plotName: 'Yesgaon Bypass Commercial Plot',
        latitude: 19.8830,
        longitude: 74.4880,
        score: 91,
        reasons: ['Zoned as Commercial - high transit access', 'High healthcare gap (> 2km)', 'Excellent arterial road accessibility']
      };

      const recs = (candidates && candidates.length > 0) ? candidates.map((c, i) => ({
        rank: i + 1,
        name: targetLang === 'mr-IN' ? 'येसगाव बायपास व्यावसायिक भूखंड' : (c.plotName || c.name || `Candidate Plot #${i + 1}`),
        latitude: c.latitude,
        longitude: c.longitude,
        score: c.score,
        reasons: targetLang === 'mr-IN' 
          ? [
              'व्यावसायिक क्षेत्र - उच्च वाहतूक संपर्क',
              '२ किमी पेक्षा जास्त अंतरावर आरोग्य सेवेची कमतरता',
              'मुख्य रस्त्यावरून थेट वहन सुलभता'
            ]
          : (c.reasons || []),
        zoning: targetLang === 'mr-IN' ? 'व्यावसायिक' : (c.zoning || 'Commercial'),
        area: c.area || 8.5
      })) : [
        {
          rank: 1,
          name: targetLang === 'mr-IN' ? 'येसगाव बायपास व्यावसायिक भूखंड' : top.plotName,
          latitude: top.latitude,
          longitude: top.longitude,
          score: top.score,
          reasons: targetLang === 'mr-IN' 
            ? [
                'व्यावसायिक क्षेत्र - उच्च वाहतूक संपर्क',
                '२ किमी पेक्षा जास्त अंतरावर आरोग्य सेवेची कमतरता',
                'मुख्य रस्त्यावरून थेट वहन सुलभता'
              ]
            : top.reasons,
          zoning: targetLang === 'mr-IN' ? 'व्यावसायिक' : 'Commercial',
          area: 8.5
        }
      ];

      let answerText = '';
      if (targetLang === 'mr-IN') {
        answerText = "वॉर्ड " + wardId + " मध्ये " + recs[0].name + " जवळ नवीन रुग्णालयासाठी जागा उपलब्ध आहे. हा परिसर रुग्णालयासाठी योग्य दिसतो. हवे असल्यास मी हे नकाशावर दाखवू शकतो.";
      } else if (targetLang === 'hi-IN') {
        answerText = "वार्ड " + wardId + " में " + recs[0].name + " के पास नए अस्पताल के लिए जगह उपलब्ध है। यह क्षेत्र अस्पताल के लिए उपयुक्त लगता है। अगर आप चाहें तो मैं इसे नक्शे पर दिखा सकता हूँ।";
      } else {
        answerText = "There is a suitable location for a new hospital in Ward " + wardId + " at " + recs[0].name + ". I can show you this location on the map if you'd like.";
      }

      return {
        success: true,
        answer: answerText,
        recommendations: recs,
        mapAction: {
          type: 'SHOW_CANDIDATES',
          latitude: recs[0].latitude,
          longitude: recs[0].longitude,
          zoom: 15
        },
        sources: ["PostgreSQL/PostGIS Land Use Data", "Spatial Analysis Microservice"],
        mcpToolUsed,
        mcpSuccess
      };
    }

    // 2. SCHOOL / EDUCATION FACILITY LOCATION INTENT
    if (intentInfo.intent === INTENTS.SCHOOL_LOCATION) {
      mcpToolUsed = 'find_suitable_locations';
      let candidates = [];
      try {
        candidates = await mcpClient.callTool('find_suitable_locations', { facilityType: 'school', wardId });
        mcpResultData = candidates;
      } catch (err) {
        mcpSuccess = false;
        console.error(`[MCP Error] ${mcpToolUsed}:`, err.message);
      }

      const recs = (candidates && candidates.length > 0) ? candidates.map((c, i) => ({
        rank: i + 1,
        name: targetLang === 'mr-IN' ? 'वॉर्ड ४ शैक्षणिक राखीव भूखंड' : (c.plotName || c.name || `School Plot #${i + 1}`),
        latitude: c.latitude,
        longitude: c.longitude,
        score: c.score,
        reasons: targetLang === 'mr-IN' 
          ? [
              'सार्वजनिक सुविधांसाठी राखीव क्षेत्र',
              '१.५ किमी परिसरात प्राथमिक शाळेची कमतरता',
              'सुरक्षित पादचारी मार्ग'
            ]
          : (c.reasons || []),
        zoning: targetLang === 'mr-IN' ? 'सार्वजनिक राखीव' : (c.zoning || 'Government/Public'),
        area: c.area || 6.2
      })) : [
        {
          rank: 1,
          name: targetLang === 'mr-IN' ? 'वॉर्ड ४ शैक्षणिक राखीव भूखंड' : 'Ward 4 Educational Reserve Plot',
          latitude: 19.8910,
          longitude: 74.4795,
          score: 88,
          reasons: targetLang === 'mr-IN' 
            ? [
                'सार्वजनिक सुविधांसाठी राखीव क्षेत्र',
                '१.५ किमी परिसरात प्राथमिक शाळेची कमतरता',
                'सुरक्षित पादचारी मार्ग'
              ]
            : ['Zoned for Public Amenities', 'Zero primary schools within 1.5km', 'Safe pedestrian access'],
          zoning: targetLang === 'mr-IN' ? 'सार्वजनिक राखीव' : 'Government/Public',
          area: 6.2
        }
      ];

      let answerText = '';
      if (targetLang === 'mr-IN') {
        answerText = "वॉर्ड " + wardId + " मध्ये " + recs[0].name + " येथे नवीन शाळेसाठी जागा उपलब्ध आहे. हा परिसर शैक्षणिक सुविधेसाठी योग्य दिसतो. हवे असल्यास मी हे नकाशावर दाखवू शकतो.";
      } else if (targetLang === 'hi-IN') {
        answerText = "वार्ड " + wardId + " में " + recs[0].name + " के पास नए स्कूल के लिए जगह उपलब्ध है। यह क्षेत्र शैक्षणिक सुविधा के लिए उपयुक्त लगता है। अगर आप चाहें तो मैं इसे नक्शे पर दिखा सकता हूँ।";
      } else {
        answerText = "There is a suitable location for a new school in Ward " + wardId + " at " + recs[0].name + ". I can show you this location on the map if you'd like.";
      }

      return {
        success: true,
        answer: answerText,
        recommendations: recs,
        mapAction: {
          type: 'SHOW_CANDIDATES',
          latitude: recs[0].latitude,
          longitude: recs[0].longitude,
          zoom: 15
        },
        sources: ["PostgreSQL/PostGIS Land Use Data", "Education Planning Engine"],
        mcpToolUsed,
        mcpSuccess
      };
    }

    // 3. INFRASTRUCTURE GAPS INTENT
    if (intentInfo.intent === INTENTS.INFRASTRUCTURE_GAPS) {
      mcpToolUsed = 'analyze_infrastructure_gap';
      let gapAnalysis = null;
      try {
        gapAnalysis = await mcpClient.callTool('analyze_infrastructure_gap', { wardId });
        mcpResultData = gapAnalysis;
      } catch (err) {
        mcpSuccess = false;
        console.error(`[MCP Error] ${mcpToolUsed}:`, err.message);
        gapAnalysis = {
          ward: wardId,
          gaps: [
            { category: 'Healthcare', severity: 'HIGH', evidence: ['Zero primary care facilities inside ward boundary'] },
            { category: 'Utilities & Drainage', severity: 'MEDIUM', evidence: ['Unresolved storm water logging complaints near Tilak Bypass'] }
          ]
        };
      }

      let answerText = '';
      if (targetLang === 'mr-IN') {
        answerText = (gapAnalysis.ward || wardId) + " मध्ये काही पायाभूत सुविधांची कमतरता आढळली आहे, जसे की " + gapAnalysis.gaps.map(g => g.category).join(' आणि ') + ". यावर लवकर उपाययोजना करणे गरजेचे आहे.";
      } else if (targetLang === 'hi-IN') {
        answerText = (gapAnalysis.ward || wardId) + " में कुछ बुनियादी ढाँचे की कमियां पाई गई हैं, जैसे कि " + gapAnalysis.gaps.map(g => g.category).join(' और ') + "। इन पर जल्द ध्यान देने की आवश्यकता है।";
      } else {
        answerText = "There are some infrastructure gaps identified in " + (gapAnalysis.ward || wardId) + ", specifically concerning " + gapAnalysis.gaps.map(g => g.category).join(' and ') + ". These require early attention.";
      }

      return {
        success: true,
        answer: answerText,
        recommendations: [],
        mapAction: null,
        sources: ["PostgreSQL Database", "Municipal Grievances Registry"],
        mcpToolUsed,
        mcpSuccess
      };
    }

    // 4. WATER / DRAINAGE PROBLEMS INTENT
    if (intentInfo.intent === INTENTS.WATER_DRAINAGE) {
      mcpToolUsed = 'get_complaints';
      let complaints = [];
      try {
        complaints = await mcpClient.callTool('get_complaints', { category: 'Water Supply', wardId });
        mcpResultData = complaints;
      } catch (err) {
        mcpSuccess = false;
        console.error(`[MCP Error] ${mcpToolUsed}:`, err.message);
      }

      let answerText = '';
      if (targetLang === 'mr-IN') {
        answerText = "वॉर्ड " + wardId + " मध्ये प्रामुख्याने पाणीपुरवठा आणि जलनिस्सारणाच्या काही समस्या आहेत. उदा. टिळक रस्ता परिसरात कमी दाबाने पाणी येणे. हवे असल्यास मी या समस्येचे ठिकाण नकाशावर दाखवू शकतो.";
      } else if (targetLang === 'hi-IN') {
        answerText = "वार्ड " + wardId + " में मुख्य रूप से जल आपूर्ति और जल निकासी की कुछ समस्याएं हैं। उदाहरण के लिए, तिलक रोड क्षेत्र में कम दबाव से पानी आना। अगर आप चाहें तो मैं इस समस्या का स्थान नक्शे पर दिखा सकता हूँ।";
      } else {
        answerText = "There are some water supply and drainage issues in Ward " + wardId + ", such as low water pressure in the Tilak Road area. I can show you the affected locations on the map if you'd like.";
      }

      return {
        success: true,
        answer: answerText,
        recommendations: [
          { 
            name: targetLang === 'mr-IN' ? 'टिळक रस्ता जलवाहिनी केंद्र' : "Tilak Road Water Pipeline Node", 
            latitude: 19.8870, 
            longitude: 74.4760, 
            score: 85, 
            reasons: targetLang === 'mr-IN' ? ["कमी दाबाने पाणीपुरवठ्याची वारंवार तक्रार क्षेत्र"] : ["High frequency of low-pressure water grievances"] 
          }
        ],
        mapAction: { type: 'FLY_TO', latitude: 19.8870, longitude: 74.4760, zoom: 15 },
        sources: ["Municipal Water Works Department", "Citizen Complaints DB"],
        mcpToolUsed,
        mcpSuccess
      };
    }

    // 5. ROADS / TRANSPORT INTENT
    if (intentInfo.intent === INTENTS.ROADS_TRANSPORT) {
      mcpToolUsed = 'get_projects';
      let projects = [];
      try {
        projects = await mcpClient.callTool('get_projects', { category: 'Road Construction' });
        mcpResultData = projects;
      } catch (err) {
        mcpSuccess = false;
        console.error(`[MCP Error] ${mcpToolUsed}:`, err.message);
      }

      let answerText = '';
      if (targetLang === 'mr-IN') {
        answerText = "येसगाव बायपास रस्त्याचे (PRJ-2026-002) काम संथ गतीने चालू आहे. यासोबतच स्टेशन रोड जोड रस्त्याचे डांबरीकरण आवश्यक आहे. हवे असल्यास मी बायपास रस्त्याचे काम नकाशावर दाखवू शकतो.";
      } else if (targetLang === 'hi-IN') {
        answerText = "यसगांव बायपास रोड (PRJ-2026-002) का काम धीमी गति से चल रहा है। इसके साथ ही स्टेशन रोड कनेक्टिंग मार्ग का डामरीकरण आवश्यक है। अगर आप चाहें तो मैं बायपास रोड का काम नक्शे पर दिखा सकता हूँ।";
      } else {
        answerText = "The Ward 4 Yesgaon Bypass Road project is currently delayed. There is also a need for asphalt resurfacing on the Station Road Connector. I can show you the bypass road on the map if you'd like.";
      }

      return {
        success: true,
        answer: answerText,
        recommendations: [
          { 
            name: targetLang === 'mr-IN' ? 'येसगाव बायपास रस्ता' : "Yesgaon Bypass Road", 
            latitude: 19.8830, 
            longitude: 74.4880, 
            score: 90, 
            reasons: targetLang === 'mr-IN' ? ["सक्रिय विलंबासह मुख्य वाहतूक कॉरिडॉर"] : ["Major transit corridor with active delay"] 
          }
        ],
        mapAction: { type: 'FLY_TO', latitude: 19.8830, longitude: 74.4880, zoom: 15 },
        sources: ["Public Works Department", "PostGIS Road Network"],
        mcpToolUsed,
        mcpSuccess
      };
    }

    // 6. DELAYED / HIGH RISK PROJECTS INTENT
    if (intentInfo.intent === INTENTS.DELAYED_HIGH_RISK_PROJECTS) {
      mcpToolUsed = 'get_projects_at_risk';
      let atRiskProjects = [];
      try {
        atRiskProjects = await mcpClient.callTool('get_projects_at_risk', { wardId: intentInfo.wardId || undefined });
        mcpResultData = atRiskProjects;
      } catch (err) {
        mcpSuccess = false;
        console.error(`[MCP Error] ${mcpToolUsed}:`, err.message);
      }

      const rankedList = (Array.isArray(atRiskProjects) && atRiskProjects.length > 0) ? atRiskProjects.slice(0, 5) : [
        {
          id: 'PRJ-2026-002',
          name: 'Road Development — Ward 4',
          ward: 'Ward 4 - Yesgaon Bypass',
          risk: 'HIGH',
          score: 72,
          progress: 48,
          reasons: ['Progress is 22% behind schedule', 'Budget utilization is 78% vs 48% progress', '12 unresolved complaints nearby'],
          coordinates: [19.8830, 74.4880]
        }
      ];

      let answerText = '';
      if (targetLang === 'mr-IN') {
        const items = rankedList.map((p, idx) => {
          const pName = p.name === 'Road Development — Ward 4' ? 'रस्ता विकास — वॉर्ड ४' : p.name;
          const pWard = p.ward === 'Ward 4 - Yesgaon Bypass' ? 'वॉर्ड ४ - येसगाव बायपास' : p.ward;
          const pRisk = p.risk === 'HIGH' ? 'उच्च' : p.risk;
          const pReason = (p.reasons[0] || 'वेळापत्रकात विलंब')
            .replace('Progress is 22% behind schedule', 'काम वेळापत्रकापेक्षा २२% मागे आहे')
            .replace('Budget utilization is 78% vs 48% progress', 'बजेट वापर ७८% विरुद्ध ४८% प्रगती')
            .replace('12 unresolved complaints nearby', 'जवळ १२ प्रलंबित तक्रारी');
          return `${idx + 1}. **${pName}** (${p.id}) — 🚨 **जोखीम श्रेणी: ${pRisk}** (गुण: **${p.score}/100**)\n   - वॉर्ड: ${pWard} | प्रगती: **${p.progress}%**\n   - कारण: ${pReason}`;
        }).join('\n\n');
        answerText = `🚨 **कोपरगाव स्मार्ट सिटी - तातडीने लक्ष देण्याची गरज असलेले प्रलंबित व धोक्यातील प्रकल्प**\n\nभौगोलिक तक्रारी आणि बजेट-प्रगती तफावतीनुसार तयार केलेली जोखीम यादी:\n\n${items}\n\n### 💡 नगरपालिका प्रशासनासाठी शिफारस:\nउच्च जोखीम असलेल्या प्रकल्पांचे जागेवर प्रत्यक्ष पाहणी करून निधी वितरण नियंत्रित करावे.`;
      } else if (targetLang === 'hi-IN') {
        const items = rankedList.map((p) => p.name === 'Road Development — Ward 4' ? 'सड़क विकास — वार्ड 4' : p.name).join(', ');
        answerText = "वर्तमान में " + items + " जैसी परियोजनाओं में देरी हो रही है और ये उच्च जोखिम वाली परियोजनाएं हैं। अगर आप चाहें तो मैं उनके स्थान नक्शे पर दिखा सकता हूँ।";
      } else {
        const items = rankedList.map((p) => p.name).join(', ');
        answerText = "Currently, projects like " + items + " are delayed and considered high risk. I can show you their locations on the map if you'd like.";
      }

      return {
        success: true,
        answer: answerText,
        recommendations: rankedList.map(p => ({
          name: targetLang === 'mr-IN' ? (p.name === 'Road Development — Ward 4' ? 'रस्ता विकास — वॉर्ड ४' : p.name) : p.name,
          latitude: p.coordinates ? p.coordinates[0] : 19.8830,
          longitude: p.coordinates ? p.coordinates[1] : 74.4880,
          score: p.score,
          reasons: targetLang === 'mr-IN' 
            ? (p.reasons || []).map(r => r
                .replace('Progress is 22% behind schedule', 'काम वेळापत्रकापेक्षा २२% मागे आहे')
                .replace('Budget utilization is 78% vs 48% progress', 'बजेट वापर ७८% विरुद्ध ४८% प्रगती')
                .replace('12 unresolved complaints nearby', 'जवळ १२ प्रलंबित तक्रारी')
              )
            : p.reasons
        })),
        mapAction: rankedList.length > 0 && rankedList[0].coordinates ? {
          type: 'FLY_TO',
          latitude: rankedList[0].coordinates[0],
          longitude: rankedList[0].coordinates[1],
          zoom: 15
        } : null,
        sources: ["Deterministic Project Risk Engine", "PostGIS Proximity Analysis"],
        mcpToolUsed,
        mcpSuccess
      };
    }

    // 7. ONGOING PROJECTS INTENT
    if (intentInfo.intent === INTENTS.ONGOING_PROJECTS) {
      mcpToolUsed = 'get_projects';
      let projects = [];
      try {
        projects = await mcpClient.callTool('get_projects', { wardId: intentInfo.wardId || undefined });
        mcpResultData = projects;
      } catch (err) {
        mcpSuccess = false;
        console.error(`[MCP Error] ${mcpToolUsed}:`, err.message);
      }

      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const avgProgress = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0;

      let answerText = '';
      if (targetLang === 'mr-IN') {
        const pList = projects.map(p => p.name).slice(0, 3).join(', ');
        answerText = "There are currently " + projects.length + " active projects in the city, including " + pList + ". I can provide more details or show a specific project on the map if you'd like.";
      }

      return {
        success: true,
        answer: answerText,
        recommendations: [],
        mapAction: null,
        sources: ["Municipal Smart City Projects Registry"],
        mcpToolUsed,
        mcpSuccess
      };
    }

    // 8. PROJECT SPECIFIC ANALYSIS INTENT
    if (intentInfo.intent === INTENTS.PROJECT_SPECIFIC) {
      const pId = intentInfo.projectId || 'PRJ-2026-002';
      mcpToolUsed = 'analyze_project_risk';
      let analysis = null;
      try {
        analysis = await mcpClient.callTool('analyze_project_risk', { projectId: pId });
        mcpResultData = analysis;
      } catch (err) {
        mcpSuccess = false;
        console.error(`[MCP Error] ${mcpToolUsed}:`, err.message);
        analysis = {
          projectId: pId,
          projectName: "Road Development — Ward 4",
          ward: "Ward 4 - Yesgaon Bypass",
          risk: "HIGH",
          score: 72,
          reasons: ["Expected progress: 70% vs Actual: 48% (Gap: -22%)", "Budget utilization 78% vs 48% physical progress", "12 unresolved complaints nearby"],
          metrics: { expectedProgress: 70, actualProgress: 48, progressGap: -22, budgetUtilization: 78, nearbyComplaintsCount: 12 },
          recommendations: ["Site verification of physical asphalt work required", "Address drainage grievances on bypass"]
        };
      }

      let answerText = '';
      if (targetLang === 'mr-IN') {
        const pName = analysis.projectName === "Road Development — Ward 4" ? "रस्ता विकास — वॉर्ड ४" : analysis.projectName;
        const pRisk = analysis.risk === "HIGH" ? "उच्च" : analysis.risk;
        const pReasonsTranslated = (analysis.reasons || []).map(r => r
          .replace('Expected progress', 'अपेक्षित प्रगती')
          .replace('vs Actual', 'विरुद्ध प्रत्यक्ष प्रगती')
          .replace('Gap', 'तफावत')
          .replace('Budget utilization', 'बजेट वापर')
          .replace('physical progress', 'प्रत्यक्ष प्रगती')
          .replace('unresolved complaints nearby', 'जवळ प्रलंबित तक्रारी')
        );
        const pRecommendationsTranslated = (analysis.recommendations || []).map(r => r
          .replace('Site verification of physical asphalt work required', 'प्रत्यक्ष डांबरीकरणाच्या कामाची जागेवर प्रत्यक्ष पडताळणी आवश्यक')
          .replace('Address drainage grievances on bypass', 'बायपासवरील ड्रेनेज तक्रारींचे निवारण करा')
        );
        answerText = pName + " या प्रकल्पाचे काम अपेक्षित वेळेपेक्षा मागे आहे (प्रगती: " + (analysis.metrics?.actualProgress || 48) + "%). हवे असल्यास मी हा प्रकल्प नकाशावर दाखवू शकतो.";
      } else if (targetLang === 'hi-IN') {
        const pName = analysis.projectName === "Road Development — Ward 4" ? "सड़क विकास — वार्ड 4" : analysis.projectName;
        const pRisk = analysis.risk === "HIGH" ? "उच्च" : analysis.risk;
        const pReasonsTranslated = (analysis.reasons || []).map(r => r
          .replace('Expected progress', 'अपेक्षित प्रगति')
          .replace('vs Actual', 'बनाम वास्तविक प्रगति')
          .replace('Gap', 'अंतर')
          .replace('Budget utilization', 'बजट उपयोग')
          .replace('physical progress', 'भौतिक प्रगति')
          .replace('unresolved complaints nearby', 'पास में अनसुलझी शिकायतें')
        );
        const pRecommendationsTranslated = (analysis.recommendations || []).map(r => r
          .replace('Site verification of physical asphalt work required', 'भौतिक डामर कार्य का स्थल सत्यापन आवश्यक')
          .replace('Address drainage grievances on bypass', 'बायपास पर जल निकासी की शिकायतों का निवारण करें')
        );
        answerText = pName + " परियोजना का काम अपेक्षित समय से पीछे चल रहा है (प्रगति: " + (analysis.metrics?.actualProgress || 48) + "%)। अगर आप चाहें तो मैं इस परियोजना को नक्शे पर दिखा सकता हूँ।";
      } else {
        answerText = "The " + analysis.projectName + " project is currently delayed with " + (analysis.metrics?.actualProgress) + "% progress. I can show you this project on the map if you'd like.";
      }

      return {
        success: true,
        answer: answerText,
        recommendations: [
          { 
            name: targetLang === 'mr-IN' 
              ? (analysis.projectName === "Road Development — Ward 4" ? "रस्ता विकास — वॉर्ड ४" : analysis.projectName) 
              : targetLang === 'hi-IN' 
                ? (analysis.projectName === "Road Development — Ward 4" ? "सड़क विकास — वार्ड 4" : analysis.projectName)
                : analysis.projectName, 
            latitude: 19.8830, 
            longitude: 74.4880, 
            score: analysis.score, 
            reasons: targetLang === 'mr-IN' 
              ? (analysis.reasons || []).map(r => r
                  .replace('Expected progress', 'अपेक्षित प्रगती')
                  .replace('vs Actual', 'विरुद्ध प्रत्यक्ष प्रगती')
                  .replace('Gap', 'तफावत')
                  .replace('Budget utilization', 'बजेट वापर')
                  .replace('physical progress', 'प्रत्यक्ष प्रगती')
                  .replace('unresolved complaints nearby', 'जवळ प्रलंबित तक्रारी')
                )
              : targetLang === 'hi-IN'
                ? (analysis.reasons || []).map(r => r
                    .replace('Expected progress', 'अपेक्षित प्रगति')
                    .replace('vs Actual', 'बनाम वास्तविक प्रगति')
                    .replace('Gap', 'अंतर')
                    .replace('Budget utilization', 'बजट उपयोग')
                    .replace('physical progress', 'भौतिक प्रगति')
                    .replace('unresolved complaints nearby', 'पास में अनसुलझी शिकायतें')
                  )
                : (analysis.reasons || []) 
          }
        ],
        mapAction: { type: 'FLY_TO', latitude: 19.8830, longitude: 74.4880, zoom: 16 },
        sources: ["PostGIS Spatial Analysis", "Deterministic AI Risk Engine"],
        mcpToolUsed,
        mcpSuccess
      };
    }

    // 9. GENERAL URBAN PLANNING INTENT (Catch-all for any other query)
    mcpToolUsed = 'get_ward_details';
    let wardStats = null;
    try {
      wardStats = await mcpClient.callTool('get_ward_details', { wardId });
      mcpResultData = wardStats;
    } catch (err) {
      mcpSuccess = false;
      console.error(`[MCP Error] ${mcpToolUsed}:`, err.message);
    }

    let answerText = '';
    if (targetLang === 'mr-IN') {
      answerText = `तुम्ही विचारलेला प्रश्न कोपरगावच्या नागरी नियोजनाशी संबंधित आहे. सद्यस्थितीत ${wardStats?.name || wardId} ची लोकसंख्या सुमारे ${wardStats?.population || '३५,०००'} असून येथे ${wardStats?.activeProjects || 4} प्रकल्प चालू आहेत. तुम्हाला कोणत्याही विशिष्ट प्रकल्पाची, रस्त्यांची किंवा रुग्णालयांची माहिती हवी असल्यास मला विचारू शकता.`;
    } else if (targetLang === 'hi-IN') {
      answerText = `आपका प्रश्न कोपरगांव के शहरी नियोजन से संबंधित है। वर्तमान में ${wardStats?.name || wardId} की जनसंख्या लगभग ${wardStats?.population || '35,000'} है और यहाँ ${wardStats?.activeProjects || 4} परियोजनाएं चल रही हैं। यदि आपको किसी विशिष्ट परियोजना, सड़कों या अस्पतालों की जानकारी चाहिए तो आप मुझसे पूछ सकते हैं।`;
    } else {
      answerText = `Your question is related to Kopargaon's urban planning. Currently, ${wardStats?.name || wardId} has a population of around ${wardStats?.population || '35,000'} and ${wardStats?.activeProjects || 4} active projects. If you need details on specific projects, roads, or hospitals, feel free to ask.`;
    }

    return {
      success: true,
      answer: answerText,
      recommendations: [],
      mapAction: null,
      sources: ["PostgreSQL/PostGIS City Wards Database", "Municipal Data Registry"],
      mcpToolUsed,
      mcpSuccess
    };
  }
};

export default aiService;
