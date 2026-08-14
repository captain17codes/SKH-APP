import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = process.env.GROK_MODEL || 'grok-4.5';

export const INTENTS = {
  FACILITY_LOCATION: 'FACILITY_LOCATION',
  INFRASTRUCTURE_GAP: 'INFRASTRUCTURE_GAP',
  WATER_PROBLEM: 'WATER_PROBLEM',
  DRAINAGE_PROBLEM: 'DRAINAGE_PROBLEM',
  ROAD_TRANSPORT: 'ROAD_TRANSPORT',
  LAND_SUITABILITY: 'LAND_SUITABILITY',
  ONGOING_PROJECTS: 'ONGOING_PROJECTS',
  PROJECT_RISK: 'PROJECT_RISK',
  PROJECT_ANALYSIS: 'PROJECT_ANALYSIS',
  COMPLAINT_ANALYSIS: 'COMPLAINT_ANALYSIS',
  WARD_ANALYSIS: 'WARD_ANALYSIS',
  GENERAL_URBAN_PLANNING: 'GENERAL_URBAN_PLANNING'
};

const LANG_MAP = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi'
};

const callGrok = async (systemInstruction, prompt) => {
  if (!GROK_API_KEY || GROK_API_KEY.includes('YOUR_KEY')) {
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
      timeout: 6000
    });

    const contentText = response.data?.choices?.[0]?.message?.content;
    return contentText ? JSON.parse(contentText) : null;
  } catch (e) {
    console.error('❌ Router Grok call failed:', e.message);
    return null;
  }
};

export const RouterAgent = {
  route: async (query, inputLanguage = null) => {
    console.log(`[ROUTER AGENT] Analyzing query: "${query}"`);

    // Check if external LLM is configured and valid
    if (GROK_API_KEY && !GROK_API_KEY.includes('YOUR_KEY')) {
      const systemInstruction = `You are an AI Urban Planner query router. Analyze the query and extract language, intent, facilityType, wardId, and projectId.
Intents list: ${Object.keys(INTENTS).join(', ')}.
Language list: mr-IN (Marathi), hi-IN (Hindi), en-IN (English). Detect the language of the query. If mixed (Marathi+English or Hindi+English), default to the local language (mr-IN or hi-IN) if Devanagari script is present, otherwise en-IN.
Return ONLY a JSON object:
{
  "language": "mr-IN" | "hi-IN" | "en-IN",
  "intent": "INTENT_NAME",
  "facilityType": "hospital" | "school" | null,
  "wardId": "W1" | "W2" | "W3" | "W4" | "W5" | "W6" | null,
  "projectId": "PRJ-XXXX-XXX" | null,
  "confidence": 0.0 to 1.0
}`;
      const prompt = `Query: "${query}"`;
      try {
        const result = await callGrok(systemInstruction, prompt);
        if (result && result.intent && result.language) {
          console.log(`[ROUTER AGENT LLM] Routed successfully:`, result);
          return {
            language: result.language,
            intent: result.intent,
            facilityType: result.facilityType || null,
            wardId: result.wardId || null,
            projectId: result.projectId || null,
            confidence: result.confidence || 0.9
          };
        }
      } catch (e) {
        console.warn(`[ROUTER AGENT] LLM Routing failed, using deterministic router: ${e.message}`);
      }
    }

    // Deterministic Rule-Based Agent Router (fallback)
    const lower = query.toLowerCase();
    
    // 1. Language detection
    const devanagariCount = (query.match(/[\u0900-\u097F]/g) || []).length;
    let detectedLang = inputLanguage && inputLanguage !== 'auto' ? inputLanguage : 'en-IN';
    if (devanagariCount > 0) {
      const hindiMarkers = /है\s|हैं\s|कृपया|बताइए|दिखाइए|हमें|मुझे|चाहिए|कहां|दिखाओ|बताओ|करो\s|बनाओ|अस्पताल|सड़क|विद्यालय|पानी|परियोजना/;
      if (hindiMarkers.test(query)) {
        detectedLang = 'hi-IN';
      } else {
        detectedLang = 'mr-IN'; // Default Devanagari to Marathi
      }
    } else if (inputLanguage) {
      detectedLang = inputLanguage;
    }

    // 2. Ward detection (e.g. Ward 4, वॉर्ड ४, W4)
    let wardId = null;
    const wardMatch = lower.match(/w[1-6]/i) || lower.match(/ward\s*[1-6]/i) || query.match(/वॉर्ड\s*[१-६1-6]/);
    if (wardMatch) {
      const num = wardMatch[0].match(/[1-6१-६]/)[0];
      const devToEngNum = { '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6' };
      const normNum = devToEngNum[num] || num;
      wardId = `W${normNum}`;
    }

    // 3. Project ID detection
    const prjMatch = lower.match(/prj-[0-9a-z-]+/i) || lower.match(/prj-[0-9]+/i);
    const projectId = prjMatch ? prjMatch[0].toUpperCase() : null;

    // 4. Facility type detection
    let facilityType = null;
    if (lower.includes('hospital') || lower.includes('medical') || lower.includes('हॉस्पिटल') || lower.includes('रुग्णालय') || lower.includes('अस्पताल') || lower.includes('आरोग्य') || lower.includes('दवाखाना')) {
      facilityType = 'hospital';
    } else if (lower.includes('school') || lower.includes('education') || lower.includes('शाळा') || lower.includes('विद्यालय') || lower.includes('प्राथमिक')) {
      facilityType = 'school';
    }

    // 5. Intent routing rules
    let intent = INTENTS.GENERAL_URBAN_PLANNING;

    if (facilityType) {
      if (lower.includes('suit') || lower.includes('plot') || lower.includes('land') || lower.includes('जागा') || lower.includes('जमीन') || lower.includes('क्षेत्र')) {
        intent = INTENTS.LAND_SUITABILITY;
      } else {
        intent = INTENTS.FACILITY_LOCATION;
      }
    } else if (lower.includes('gap') || lower.includes('infrastructure') || lower.includes('तूट') || lower.includes('कमतरता') || lower.includes('सुविधा') || lower.includes('पायाभूत') || lower.includes('बुनियादी')) {
      intent = INTENTS.INFRASTRUCTURE_GAP;
    } else if (lower.includes('water') || lower.includes('पाणी') || lower.includes('जल') || lower.includes('नल')) {
      intent = INTENTS.WATER_PROBLEM;
    } else if (lower.includes('drainage') || lower.includes('sewer') || lower.includes('ड्रेनेज') || lower.includes('सांडपाणी')) {
      intent = INTENTS.DRAINAGE_PROBLEM;
    } else if (lower.includes('road') || lower.includes('transport') || lower.includes('traffic') || lower.includes('street') || lower.includes('रस्ता') || lower.includes('रस्ते') || lower.includes('वाहतूक') || lower.includes('सड़क')) {
      intent = INTENTS.ROAD_TRANSPORT;
    } else if (projectId) {
      intent = INTENTS.PROJECT_ANALYSIS;
    } else if (lower.includes('risk') || lower.includes('immediate attention') || lower.includes('delayed') || lower.includes('at risk') || lower.includes('धोका') || lower.includes('तातडी') || lower.includes('प्रलंबित') || lower.includes('तत्काल') || lower.includes('लक्ष')) {
      intent = INTENTS.PROJECT_RISK;
    } else if (lower.includes('ongoing') || lower.includes('active') || lower.includes('portfolio') || lower.includes('चालू') || lower.includes('सुरू') || lower.includes('प्रकल्प') || lower.includes('योजना') || lower.includes('प्रोजेक्ट')) {
      intent = INTENTS.ONGOING_PROJECTS;
    } else if (lower.includes('complaint') || lower.includes('grievance') || lower.includes('तक्रार') || lower.includes('तक्रारी')) {
      intent = INTENTS.COMPLAINT_ANALYSIS;
    } else if (wardId && (lower.includes('ward') || lower.includes('वॉर्ड') || lower.includes('विश्लेषण'))) {
      intent = INTENTS.WARD_ANALYSIS;
    }

    console.log(`[ROUTER AGENT DETERMINISTIC] Routed: language=${detectedLang}, intent=${intent}, facilityType=${facilityType}, wardId=${wardId}, projectId=${projectId}`);
    return {
      language: detectedLang,
      intent,
      facilityType,
      wardId,
      projectId,
      confidence: 0.85
    };
  }
};

export default RouterAgent;
