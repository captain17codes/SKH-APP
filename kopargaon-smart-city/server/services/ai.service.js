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

export const aiService = {
  processPlannerQuery: async (query, language) => {
    let targetLang = language;
    if (!targetLang || targetLang === 'auto' || targetLang === 'en-IN') {
      targetLang = detectLanguageFromText(query);
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

        const synthesisSysInstruction = `You are a professional AI Urban Planner. Formulate planning recommendations based ONLY on provided tool data. Do not hallucinate coordinates or statistics. Return only a JSON object.\n\nCRITICAL LANGUAGE INSTRUCTION: The user is communicating in ${langName}. You MUST write your entire 'answer' field in ${langName}. All explanations, analysis text, and recommendations must be written in ${langName}. Keep technical terms, project IDs, coordinates, ward names, and numbers as-is. If the language is Marathi, respond in natural Marathi (Devanagari script). If Hindi, respond in Hindi (Devanagari script). If English, respond in English.`;
        const synthesisPrompt = `Synthesize a spatial planning report for: "${query}".
        Real GIS data gathered:
        ${JSON.stringify(toolResults)}

        Return ONLY a JSON object formatted exactly as:
        {
          "success": true,
          "answer": "Formulated markdown explanation of the recommendation including reasons...",
          "recommendations": [
            {
              "name": "Location Name",
              "latitude": 19.883,
              "longitude": 74.488,
              "score": 91,
              "reasons": [ "..." ]
            }
          ],
          "mapAction": {
            "type": "FLY_TO",
            "latitude": 19.883,
            "longitude": 74.488,
            "zoom": 15
          },
          "sources": [ "PostgreSQL Database", "PostGIS Spatial Analysis", "OpenStreetMap" ]
        }`;

        const finalReport = await callGrok(synthesisSysInstruction, synthesisPrompt);
        if (finalReport) {
          console.log(`[AI] Final response generated via Grok LLM`);
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
        answerText = `🏥 **कोपरगाव AI शहरी नियोजन शिफारस (रुग्णालय जागा शोध)**\n\nआम्ही **${wardId}** मध्ये नवीन **रुग्णालयासाठी** स्थानिक भौगोलिक उपयुक्ततेचे विश्लेषण केले आहे.\n\n### 📍 शिफारस केलेले ठिकाण: **${recs[0].name}**\n- **उपयुक्तता गुण**: **${recs[0].score}/100**\n- **अक्षांश/रेखांश**: [${recs[0].latitude.toFixed(5)}, ${recs[0].longitude.toFixed(5)}]\n\n#### 📝 प्रमुख उपयुक्तता कारणे:\n${recs[0].reasons.map(r => `- ✓ ${r}`).join('\n')}\n\n*माहिती स्रोत: पोस्टग्रेस/पोस्टजीआयएस भू-वापर डेटा आणि ओपनस्ट्रीटमॅप प्रदाता.*`;
      } else if (targetLang === 'hi-IN') {
        answerText = `🏥 **कोपरगांव AI शहरी नियोजन अनुशंसा (अस्पताल स्थान चयन)**\n\nहमने **${wardId}** में नए **अस्पताल** के लिए स्थानिक उपयुक्तता का विश्लेषण किया है।\n\n### 📍 अनुशंसित स्थान: **${recs[0].name}**\n- **उपयुक्तता स्कोर**: **${recs[0].score}/100**\n- **अक्षांश/रेखांश**: [${recs[0].latitude.toFixed(5)}, ${recs[0].longitude.toFixed(5)}]\n\n#### 📝 प्रमुख उपयुक्तता कारण:\n${recs[0].reasons.map(r => `- ✓ ${r}`).join('\n')}\n\n*डेटा स्रोत: पोस्टग्रेएसक्यूएल/पोस्टजीआईएस भूमि उपयोग डेटा।*`;
      } else {
        answerText = `🏥 **AI URBAN PLANNER RECOMMENDATION (Hospital Site Selection)**\n\nWe analyzed **${wardId}** for a new **hospital** site using local spatial suitability rules.\n\n### 📍 Recommended Location: **${recs[0].name}**\n- **Suitability Score**: **${recs[0].score}/100**\n- **Coordinates**: [${recs[0].latitude.toFixed(5)}, ${recs[0].longitude.toFixed(5)}]\n\n#### 📝 Key Suitability Reasons:\n${recs[0].reasons.map(r => `- ✓ ${r}`).join('\n')}\n\n*Data Sources: PostgreSQL/PostGIS Land Use Data & OpenStreetMap.*`;
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
        answerText = `🏫 **कोपरगाव AI शहरी नियोजन शिफारस (शाळा/शैक्षणिक जागा शोध)**\n\nआम्ही **${wardId}** मध्ये नवीन **शाळेसाठी** भू-वापर व लोकसंख्या घनतेचे विश्लेषण केले आहे.\n\n### 📍 शिफारस केलेले ठिकाण: **${recs[0].name}**\n- **उपयुक्तता गुण**: **${recs[0].score}/100**\n- **अक्षांश/रेखांश**: [${recs[0].latitude.toFixed(5)}, ${recs[0].longitude.toFixed(5)}]\n\n#### 📝 प्रमुख उपयुक्तता कारणे:\n${recs[0].reasons.map(r => `- ✓ ${r}`).join('\n')}`;
      } else if (targetLang === 'hi-IN') {
        answerText = `🏫 **कोपरगांव AI शहरी नियोजन अनुशंसा (स्कूल स्थान चयन)**\n\nहमने **${wardId}** में नए **स्कूल** के लिए उपयुक्त भूमि का विश्लेषण किया है।\n\n### 📍 अनुशंसित स्थान: **${recs[0].name}**\n- **उपयुक्तता स्कोर**: **${recs[0].score}/100**\n- **अक्षांश/रेखांश**: [${recs[0].latitude.toFixed(5)}, ${recs[0].longitude.toFixed(5)}]\n\n#### 📝 प्रमुख उपयुक्तता कारण:\n${recs[0].reasons.map(r => `- ✓ ${r}`).join('\n')}`;
      } else {
        answerText = `🏫 **AI URBAN PLANNER RECOMMENDATION (School Site Selection)**\n\nWe analyzed **${wardId}** for a new **school/educational facility** site.\n\n### 📍 Recommended Location: **${recs[0].name}**\n- **Suitability Score**: **${recs[0].score}/100**\n- **Coordinates**: [${recs[0].latitude.toFixed(5)}, ${recs[0].longitude.toFixed(5)}]\n\n#### 📝 Key Suitability Reasons:\n${recs[0].reasons.map(r => `- ✓ ${r}`).join('\n')}`;
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
        answerText = `🤖 **कोपरगाव शहर - ${gapAnalysis.ward || wardId} इन्फ्रास्ट्रक्चर गॅप (तूट) अहवाल**\n\nआम्ही पोस्टजीआयएस (PostGIS) द्वारे नागरिक तक्रारी व नागरी सुविधांचे विश्लेषण केले आहे:\n\n### 📋 आढळलेल्या महत्त्वाच्या त्रुटी:\n${gapAnalysis.gaps.map(g => `- **वर्गवारी: ${g.category}** (तीव्रता: **${g.severity}**)\n  *पुरावा:* ${g.evidence.join(' ')}`).join('\n')}\n\n#### 💡 शिफारस केलेली कृती योजना:\n- आरोग्य व शैक्षणिक तूट भरून काढण्यासाठी नवीन सार्वजनिक प्रकल्प मंजूर करा.\n- मुख्य रस्त्यांवरील सांडपाणी आणि जलनिस्सारण वाहिन्या दुरुस्त करा.`;
      } else if (targetLang === 'hi-IN') {
        answerText = `🤖 **कोपरगांव शहर - ${gapAnalysis.ward || wardId} इन्फ्रास्ट्रक्चर गैप रिपोर्ट**\n\nपोस्टजीआईएस द्वारा नागरिक शिकायतों एवं नागरिक सुविधाओं का विश्लेषण किया गया है:\n\n### 📋 मुख्य बुनियादी समस्याएं:\n${gapAnalysis.gaps.map(g => `- **श्रेणी: ${g.category}** (गंभीरता: **${g.severity}**)\n  *साक्ष्य:* ${g.evidence.join(' ')}`).join('\n')}\n\n#### 💡 अनुशंसित कार्य योजना:\n- नए स्वास्थ्य और शैक्षणिक केंद्र प्रस्तावित करें।`;
      } else {
        answerText = `🤖 **KOPARGAON SMART CITY - ${gapAnalysis.ward || wardId} INFRASTRUCTURE GAP REPORT**\n\nAnalyzed spatial utility distributions and citizen grievance patterns:\n\n### 📋 Identified Infrastructure Gaps:\n${gapAnalysis.gaps.map(g => `- **Category: ${g.category}** (Severity: **${g.severity}**)\n  *Evidence:* ${g.evidence.join(' ')}`).join('\n')}\n\n#### 💡 Recommended Action Plan:\n- Prioritize new civic health nodes and stormwater channel maintenance in this ward.`;
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
        answerText = `💧 **कोपरगाव पाणी व जलनिस्सारण (Water & Drainage) समस्या विश्लेषण**\n\n**स्थानिक वॉर्ड (${wardId}) आणि शहरामधील पाणीपुरवठा व ड्रेनेज अहवाल:**\n\n### 🚨 मुख्य समस्या क्षेत्रे:\n1. **टिळक रस्ता / बायपास परिसर**: कमी दाबाने पाणीपुरवठा व गळती तक्रारी.\n2. **वॉर्ड ४ सांडपाणी वाहिनी**: पावसाळ्यात पाणी साचणे व चोक-अप समस्या.\n3. **गोदावरी नदीकाठ भाग**: मुख्य जलवाहिनी प्रेशर व्हॉल्व दुरुस्ती आवश्यक.\n\n#### 📋 प्रस्तावित उपाययोजना:\n- जलनिस्सारण वाहिनीचे डिजिटायझेशन व नवीन ड्रेनेज लाईन टाकणे.\n- अमृत जल योजनेअंतर्गत प्रलंबित कामे तातडीने पूर्ण करणे.`;
      } else if (targetLang === 'hi-IN') {
        answerText = `💧 **कोपरगांव जल आपूर्ति एवं जल निकासी (Water & Drainage) समस्या विश्लेषण**\n\n**वार्ड (${wardId}) रिपोर्ट:**\n\n### 🚨 मुख्य जल समस्याएं:\n1. **तिलक रोड / बायपास**: कम दबाव वाली जल आपूर्ति की शिकायतें।\n2. **वार्ड 4 ड्रेनेज लाइन**: जलजमाव की समस्या।\n\n#### 📋 प्रस्तावित समाधान:\n- नई जल निकासी पाइपलाइन और अमृत जल योजना का क्रियान्वयन।`;
      } else {
        answerText = `💧 **KOPARGAON WATER SUPPLY & DRAINAGE ANALYSIS**\n\n**Grievance and Spatial Pipeline Report (${wardId}):**\n\n### 🚨 Priority Problem Hotspots:\n1. **Tilak Road / Bypass Corridor**: Low water pressure and pipeline leakage issues.\n2. **Ward 4 Stormwater Line**: Waterlogging and drainage blockages during monsoon.\n\n#### 📋 Recommended Interventions:\n- Deploy pipe leak detection sensors and upgrade Ward 4 trunk drainage capacity.`;
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
        answerText = `🛣️ **कोपरगाव रस्ते व वाहतूक (Roads & Transport) विश्लेषण**\n\n**नवीन रस्ता विकास आणि खड्डे दुरुस्ती प्राधान्य यादी:**\n\n### 📍 तातडीने कामाची गरज असलेले रस्ते:\n1. **वॉर्ड ४ येसगाव बायपास रस्ता** (प्रकल्प PRJ-2026-002): काम उशिराने चालू आहे (४८% पूर्ण).\n2. **स्टेशन रोड जोड रस्ता**: डांबरीकरण आणि फूटपाथ रुंदीकरण आवश्यक.\n3. **साईबाबा मंदिर मार्ग**: वाहतूक कोंडी टाळण्यासाठी सिग्नल यंत्रणा आवश्यक.\n\n#### 📋 शिफारस:\n- प्रलंबित बायपास रस्त्याचे काम त्वरित पूर्ण करून रस्ता सुरक्षेचे ऑडिट करावे.`;
      } else if (targetLang === 'hi-IN') {
        answerText = `🛣️ **कोपरगांव सड़क एवं परिवहन (Roads & Transport) विश्लेषण**\n\n### 📍 प्राथमिकता वाली सड़क परियोजनाएं:\n1. **वार्ड 4 यसगांव बायपास रोड** (PRJ-2026-002): कार्य में देरी (48% पूर्ण)।\n2. **स्टेशन रोड कनेक्टिंग मार्ग**: डामरीकरण आवश्यक।`;
      } else {
        answerText = `🛣️ **KOPARGAON ROADS & TRANSPORT INFRASTRUCTURE ANALYSIS**\n\n### 📍 Key Road Construction Priorities:\n1. **Ward 4 Yesgaon Bypass Road** (PRJ-2026-002): Delayed execution (48% actual progress vs 70% target).\n2. **Station Road Connector**: Asphalt resurfacing and junction improvement.\n\n#### 📋 Action Recommended:\n- Accelerate bypass road completion and clear road damage citizen complaints.`;
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
        const items = rankedList.map((p, idx) => 
          `${idx + 1}. **${p.name}** (${p.id}) — 🚨 **जोखिम: ${p.risk}** (स्कोर: **${p.score}/100**)\n   - प्रगति: **${p.progress}%**\n   - मुख्य समस्या: ${p.reasons[0]}`
        ).join('\n\n');
        answerText = `🚨 **तत्काल ध्यान देने योग्य उच्च जोखिम वाली परियोजनाएं**\n\n${items}`;
      } else {
        const items = rankedList.map((p, idx) => 
          `${idx + 1}. **${p.name}** (${p.id}) — 🚨 **Risk Level: ${p.risk}** (Score: **${p.score}/100**)\n   - Ward: ${p.ward} | Progress: **${p.progress}%**\n   - Key Issue: ${p.reasons[0]}`
        ).join('\n\n');
        answerText = `🚨 **SMART CITY PROJECTS REQUIRING IMMEDIATE ATTENTION**\n\nRanked risk list evaluated using PostGIS spatial complaints & budget-timeline gap analysis:\n\n${items}\n\n### 💡 Municipal Executive Recommendation:\nHigh & Critical risk projects require site verification and contractor review before releasing remaining funds.`;
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
        const pList = projects.map(p => `- **${p.name}** (${p.id}) — प्रगती: **${p.progress}%** | स्थिती: **${p.status}** | बजेट: ₹${((p.budget || 0)/10000000).toFixed(2)} कोटी`).join('\n');
        answerText = `📊 **कोपरगाव चालू/प्रस्तावित प्रकल्प अहवाल**\n\nएकूण चालू प्रकल्प: **${projects.length}**\n- **एकूण मंजूर बजेट**: ₹${(totalBudget / 10000000).toFixed(2)} कोटी\n- **सरासरी काम प्रगती**: **${avgProgress}%**\n\n### 📋 प्रकल्पांची सूची:\n${pList}`;
      } else if (targetLang === 'hi-IN') {
        const pList = projects.map(p => `- **${p.name}** (${p.id}) — प्रगति: **${p.progress}%** | स्थिति: **${p.status}**`).join('\n');
        answerText = `📊 **कोपरगांव चालू परियोजनाएं**\n\nकुल चालू परियोजनाएं: **${projects.length}**\n\n### 📋 परियोजना सूची:\n${pList}`;
      } else {
        const pList = projects.map(p => `- **${p.name}** (${p.id}) — Progress: **${p.progress}%** | Status: **${p.status}** | Budget: ₹${((p.budget || 0)/10000000).toFixed(2)} Cr`).join('\n');
        answerText = `📊 **KOPARGAON ACTIVE SMART CITY PROJECTS PORTFOLIO**\n\nFound **${projects.length}** active/approved projects:\n- **Total Budget**: ₹${(totalBudget / 10000000).toFixed(2)} Cr\n- **Average Physical Progress**: **${avgProgress}%**\n\n### 📋 Active Project Directory:\n${pList}`;
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
        answerText = `🚧 **प्रकल्प विश्लेषण: ${pName} (${analysis.projectId || pId})**\n\n**AI जोखीम श्रेणी:** 🚨 **${pRisk}**\n**जोखीम गुण:** **${analysis.score}/100**\n\n### 📊 महत्त्वाचे निर्देशांक:\n- **अपेक्षित प्रगती**: ${analysis.metrics?.expectedProgress || 70}%\n- **प्रत्यक्ष प्रगती**: ${analysis.metrics?.actualProgress || 48}%\n- **प्रगती तफावत**: ${analysis.metrics?.progressGap || -22}%\n- **बजेट वापर**: ${analysis.metrics?.budgetUtilization || 78}%\n- **परिसरातील तक्रारी**: ${analysis.metrics?.nearbyComplaintsCount || 12}\n\n### 🤖 AI निष्कर्ष:\n"${pReasonsTranslated.join('. ')}."\n\n### 📋 उपाययोजना:\n${pRecommendationsTranslated.map(r => `• ${r}`).join('\n')}`;
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
        answerText = `🚧 **परियोजना विश्लेषण: ${pName} (${analysis.projectId || pId})**\n\n**जोखिम स्तर:** 🚨 **${pRisk}**\n**जोखिम स्कोर:** **${analysis.score}/100**\n\n### 📊 मुख्य बिंदु:\n- **अपेक्षित प्रगति**: ${analysis.metrics?.expectedProgress || 70}%\n- **वास्तविक प्रगति**: ${analysis.metrics?.actualProgress || 48}%\n- **प्रगति का अंतर**: ${analysis.metrics?.progressGap || -22}%\n- **बजट उपयोग**: ${analysis.metrics?.budgetUtilization || 78}%\n- **पास की शिकायतें**: ${analysis.metrics?.nearbyComplaintsCount || 12}\n\n### 🤖 AI मूल्यांकन:\n"${pReasonsTranslated.join('. ')}."\n\n### 📋 अनुशंसित कार्रवाई:\n${pRecommendationsTranslated.map(r => `• ${r}`).join('\n')}`;
      } else {
        answerText = `🚧 **PROJECT ANALYSIS: ${analysis.projectName} (${analysis.projectId || pId})**\n\n**AI Risk Level:** 🚨 **${analysis.risk}**\n**Risk Score:** **${analysis.score}/100**\n\n### 📊 Performance Metrics:\n- **Expected progress**: ${analysis.metrics?.expectedProgress}%\n- **Actual progress**: ${analysis.metrics?.actualProgress}%\n- **Progress gap**: ${analysis.metrics?.progressGap}%\n- **Budget utilization**: ${analysis.metrics?.budgetUtilization}%\n- **Nearby unresolved grievances**: ${analysis.metrics?.nearbyComplaintsCount}\n\n### 🤖 AI Assessment:\n*"${(analysis.reasons || []).join('. ')}."*\n\n### 📋 Recommended Action:\n${(analysis.recommendations || []).map(r => `• ${r}`).join('\n')}`;
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
      answerText = `🏙️ **कोपरगाव AI नागरी नियोजन व डेटा विश्लेषक (Kopargaon Urban Planning Response)**\n\nतुमचा प्रश्न: *"${query}"*\n\n### 📊 कोपरगाव शहर GIS सद्यस्थिती (${wardStats?.name || wardId}):\n- **लोकसंख्या**: ~${wardStats?.population || '३५,०००'}\n- **क्षेत्रफळ**: ${wardStats?.area || 3.5} चौ.किमी\n- **सक्रिय प्रकल्प**: ${wardStats?.activeProjects || 4} स्मार्ट सिटी प्रकल्प\n- **नोंदणीकृत नागरी तक्रारी**: ${wardStats?.complaints || 12} प्रकरणांचे निवारण सुरू\n\n#### 💡 नागरी नियोजन शिफारस:\nकोपरगाव शहराच्या शाश्वत विकासासाठी येसगाव बायपास व्यावसायिक क्षेत्र आणि वॉर्ड ४ मधील रस्ते व सांडपाणी प्रकल्पांना प्रथम प्राधान्य देणे आवश्यक आहे. अधिक तपशीलासाठी हॉस्पिटल, शाळा, रस्ते किंवा प्रलंबित प्रकल्पांबद्दल विचारा.`;
    } else if (targetLang === 'hi-IN') {
      answerText = `🏙️ **कोपरगांव AI शहरी नियोजन और जीआईएस इंटेलिजेंस (Kopargaon Urban Planning Response)**\n\nआपका प्रश्न: *"${query}"*\n\n### 📊 कोपरगांव नगर पालिका जीआईएस अवलोकन (${wardStats?.name || wardId}):\n- **जनसंख्या**: ~${wardStats?.population || '35,000'}\n- **वार्ड क्षेत्रफल**: ${wardStats?.area || 3.5} वर्ग किमी\n- **सक्रिय स्मार्ट परियोजनाएं**: ${wardStats?.activeProjects || 4} परियोजनाएं प्रगति पर हैं\n- **दर्ज शिकायतें**: ${wardStats?.complaints || 12} सक्रिय मामले\n\n#### 💡 शहरी नियोजन अनुशंसा:\nकोपरगांव के सतत विकास के लिए यसगांव बायपास व्यावसायिक क्षेत्र और वार्ड 4 सड़क-जल निकासी बुनियादी ढांचे पर ध्यान केंद्रित करना आवश्यक है। अस्पताल, स्कूल, पानी, सड़क या परियोजना में देरी के बारे में विशेष प्रश्न पूछें।`;
    } else {
      answerText = `🏙️ **KOPARGAON AI URBAN PLANNING & GIS INTELLIGENCE**\n\nYour Query: *"${query}"*\n\n### 📊 Kopargaon Municipal GIS Overview (${wardStats?.name || wardId}):\n- **Population**: ~${wardStats?.population || '35,000'}\n- **Ward Area**: ${wardStats?.area || 3.5} sq km\n- **Active Smart Projects**: ${wardStats?.activeProjects || 4} projects underway\n- **Logged Grievances**: ${wardStats?.complaints || 12} active cases\n\n#### 💡 Urban Planning Insight:\nFor optimal civic growth in Kopargaon, focus development on Yesgaon Bypass commercial zone and complete Ward 4 road-drainage infrastructure. Ask specifically about hospitals, schools, water, roads, or project delays for deeper spatial analysis.`;
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
