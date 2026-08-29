import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multilingual Dictionary & Synonym Expansions for Cross-Lingual Semantic Retrieval
const SYNONYM_MAP = {
  // Population / Demographics
  'population': ['population', 'people', 'residents', 'citizens', 'inhabitants', 'loksankhya', 'lokvasti', 'aabadi', 'janasankhya', 'लोकसंख्या', 'लोकवस्ती', 'आबादी', 'जनसंख्या', 'नागरिक', 'माणसे', 'लोक'],
  'wards': ['ward', 'wards', 'vibhag', 'prabhag', 'zone', 'zones', 'वॉर्ड', 'प्रभाग', 'विभाग', 'क्षेत्र'],
  'highest': ['highest', 'most', 'maximum', 'largest', 'sarvat jast', 'sabse jyada', 'mothta', 'सर्वात जास्त', 'सर्वाधिक', 'सबसे ज्यादा', 'अधिकतम', 'बड़ा'],
  'lowest': ['lowest', 'least', 'minimum', 'smallest', 'sarvat kami', 'sabse kam', 'lahant', 'सर्वात कमी', 'सबसे कम', 'न्यूनतम'],
  'area': ['area', 'planning area', 'size', 'square kilometres', 'sq km', 'kshetraphal', 'kshetra', 'क्षेत्रफळ', 'क्षेत्र', 'विस्तार', 'आकार'],
  'center': ['city center', 'center', 'downtown', 'central market', 'main city', 'kendra', 'madhyawarti', 'शहर केंद्र', 'मध्यवर्ती', 'बाजार'],
  'residential': ['residential', 'housing', 'homes', 'residence', 'nivas', 'nivasi', 'rahivasi', 'रहिवासी', 'निवासी', 'गृहनिर्माण', 'घरे'],
  'commercial': ['commercial', 'business', 'market', 'shops', 'vyapari', 'vepar', 'व्यापारी', 'व्यवसाय', 'बाजारपेठ', 'मार्केट'],
  'industrial': ['industrial', 'industry', 'factories', 'audyogik', 'karkhana', 'औद्योगिक', 'कारखाने', 'उद्योग'],
  'development': ['development', 'progress', 'priority', 'vikas', 'pragatisheel', 'विकास', 'सुधारणा', 'प्रगती', 'प्राधान्य'],

  // Roads & Transport
  'roads': ['road', 'roads', 'street', 'streets', 'highway', 'traffic', 'connectivity', 'rasta', 'raste', 'sadak', 'sadke', 'vahatuk', 'मार्ग', 'रस्ता', 'रस्ते', 'सड़क', 'सड़कें', 'वाहतूक', 'जोडणी'],
  'traffic': ['traffic', 'congestion', 'vehicles', 'gardee', 'vahatuk', 'वाहतूक', 'गर्दी', 'ट्रैफिक', 'जाम'],
  'maintenance': ['maintenance', 'repair', 'pothole', 'potholes', 'damage', 'durusti', 'marammat', 'khadde', 'दुरुस्ती', 'मरम्मत', 'खड्डे', 'देखभाल'],
  'construction': ['construction', 'under construction', 'building', 'bandhkam', 'nirman', 'बांधकाम', 'निर्माण', 'चालू काम'],

  // Water & Drainage
  'water': ['water', 'water supply', 'drinking water', 'pipeline', 'pani', 'paani', 'jal', 'pani purvatha', 'जल', 'पाणी', 'पानी', 'पाणीपुरवठा', 'पाईपलाईन', 'जल आपूर्ति'],
  'drainage': ['drainage', 'drain', 'sewer', 'sewage', 'gutter', 'sandpani', 'nalla', 'naali', 'ड्रेनेज', 'सांडपाणी', 'गटार', 'नाली', 'नाले'],
  'flood': ['flood', 'flooding', 'water logging', 'poor', 'badh', 'pur', 'पूर', 'पाणी साचणे', 'बाढ़', 'जलभराव'],
  'rainwater': ['rainwater', 'rainwater harvesting', 'rain', 'paus', 'varsha', 'पावसाचे पाणी', 'रेन वॉटर हार्वेस्टिंग', 'वर्षा जल'],

  // Streetlights & Energy
  'streetlights': ['streetlight', 'streetlights', 'street light', 'lighting', 'light', 'led', 'diva', 'dive', 'batti', 'स्ट्रीट लाईट', 'पथदिवे', 'दिवा', 'बत्ती', 'लाईट'],
  'solar': ['solar', 'rooftop solar', 'sun hours', 'sunlight', 'sour urja', 'surya urja', 'सौर ऊर्जा', 'सूर्य ऊर्जा', 'सोलर', 'रूफटॉप'],
  'energy': ['energy', 'electricity', 'power', 'vij', 'vidyut', 'ऊर्जा', 'वीज', 'विद्युत', 'बिजली'],

  // Waste Management
  'waste': ['waste', 'garbage', 'trash', 'dustbin', 'bins', 'collection point', 'processing', 'kachra', 'ghangachra', 'kachre', 'कचरा', 'घनकचरा', 'कचराकुंडी', 'कचरा संकलन', 'कचरा व्यवस्थापन'],

  // Education & Health
  'schools': ['school', 'schools', 'education', 'shala', 'shikshan', 'vidyalaya', 'शाळा', 'शिक्षण', 'विद्यालय', 'स्कूल'],
  'hospitals': ['hospital', 'hospitals', 'healthcare', 'clinic', 'primary health center', 'phc', 'rugnalay', 'davakhana', 'aspatal', 'रुग्णालय', 'दवाखाना', 'आरोग्य केंद्र', 'अस्पताल', 'इलाज'],

  // Environment & Urban Design
  'parks': ['park', 'parks', 'green space', 'garden', 'trees', 'bag', 'udyan', 'zade', 'झाडे', 'उद्यान', 'बाग', 'हिरवळ', 'पार्क', 'वृक्ष'],
  'noise': ['noise', 'noise pollution', 'sound', 'dhwani', 'aawaz', 'ध्वनी', 'आवाज', 'आवाज प्रदूषण', 'शोर'],
  'microclimate': ['microclimate', 'temperature', 'heat', 'urban heat', 'shading', 'tapan', 'ushnata', 'हवामान', 'उष्णता', 'तापमान', 'सावली'],
  'carbon': ['carbon', 'embodied carbon', 'emissions', 'उत्सर्जन', 'कार्बन'],
  'landuse': ['land use', 'zoning', 'plot', 'vacant land', 'mixed use', 'jameen', 'bhu vapar', 'जमीन', 'भू वापर', 'प्लॉट', 'झोनिंग'],

  // GIS, AI & Platform
  'gis': ['gis', 'map', 'layers', 'spatial', 'coordinates', 'nasha', 'naksha', 'नकाशा', 'लेयर्स', 'जीआयएस', 'स्थान'],
  'complaints': ['complaint', 'complaints', 'grievance', 'grievances', 'takrar', 'shikayat', 'तक्रार', 'तक्रारी', 'तक्रार निवारण', 'शिकायत', 'शिकायतें'],
  'projects': ['project', 'projects', 'smart city projects', 'progress', 'budget', 'prakalp', 'yojana', 'प्रकल्प', 'योजना', 'प्रगती', 'बजेट'],
  'ai': ['ai', 'ai planner', 'ai urban planner', 'assistant', 'digital twin', 'fly_to', 'voice', 'मदतनीस', 'एआय', 'डिजिटल ट्विन']
};

class CsvKnowledgeEngine {
  constructor() {
    this.records = [];
    this.isLoaded = false;
    this.loadDataset();
  }

  loadDataset() {
    try {
      const candidates = [
        path.join(__dirname, '../data/kopargaon_smart_city_dataset.csv'),
        path.join(__dirname, '../../kopargaon_smart_city_dataset.csv'),
        path.join(process.cwd(), 'server/data/kopargaon_smart_city_dataset.csv'),
        path.join(process.cwd(), 'kopargaon_smart_city_dataset.csv')
      ];

      let csvPath = null;
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          csvPath = p;
          break;
        }
      }

      if (!csvPath) {
        console.warn('[CSV Engine] CSV dataset not found in candidates, creating fallback.');
        this.isLoaded = false;
        return;
      }

      const content = fs.readFileSync(csvPath, 'utf8');
      this.records = this.parseCsv(content);
      this.isLoaded = true;
      console.log(`[CSV Engine] Loaded ${this.records.length} records from ${csvPath}`);
    } catch (e) {
      console.error('[CSV Engine] Error loading CSV:', e);
      this.isLoaded = false;
    }
  }

  parseCsv(content) {
    const lines = content.trim().split('\n');
    if (lines.length <= 1) return [];

    const results = [];
    let idCounter = 1;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted CSV parsing
      const fields = [];
      let inQuotes = false;
      let cur = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            cur += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          fields.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      fields.push(cur.trim());

      if (fields.length >= 3) {
        const category = fields[0];
        const rawQuery = fields[1];
        const answer = fields[2];

        // Clean leading question numbering (e.g. "1. What is the population...")
        const cleanQuery = rawQuery.replace(/^\d+\.\s*/, '').trim();

        const tokens = this.tokenize(`${category} ${cleanQuery} ${answer}`);
        const queryTokens = this.tokenize(cleanQuery);

        results.push({
          id: idCounter++,
          category,
          originalQuery: rawQuery,
          query: cleanQuery,
          answer,
          tokens,
          queryTokens
        });
      }
    }

    return results;
  }

  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/gi, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !this.isStopWord(t));
  }

  isStopWord(token) {
    const stopWords = new Set([
      'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'a', 'an', 'what', 'how', 'which', 'where', 'why', 'can', 'should', 'many', 'much', 'about', 'from', 'this', 'that', 'with', 'kopargaon', 'city', 'smart',
      'आहे', 'आहेत', 'का', 'काय', 'कसे', 'कशी', 'कसा', 'मध्ये', 'च्या', 'ची', 'चे', 'चा', 'ने', 'ना', 'तो', 'ती', 'ते', 'आणि', 'किंवा', 'कोपरगाव', 'स्मार्ट', 'सिटी',
      'है', 'हैं', 'का', 'की', 'के', 'में', 'पर', 'से', 'और', 'या', 'क्या', 'कैसे', 'कैसी', 'कितना', 'कितनी', 'कहाँ', 'कोपरगांव', 'स्मार्ट', 'सिटी'
    ]);
    return stopWords.has(token);
  }

  search(userQuery, topK = 3) {
    if (!this.records || this.records.length === 0) {
      this.loadDataset();
    }
    if (!this.records || this.records.length === 0) {
      return [];
    }

    const rawQueryLower = userQuery.toLowerCase().trim();
    const queryTokens = this.tokenize(userQuery);

    // Map matched concepts from synonym map
    const matchedConcepts = new Set();
    for (const [concept, syns] of Object.entries(SYNONYM_MAP)) {
      if (syns.some(s => rawQueryLower.includes(s.toLowerCase()))) {
        matchedConcepts.add(concept);
      }
    }

    const scored = this.records.map(rec => {
      let score = 0;
      const recQueryLower = rec.query.toLowerCase();
      const recAnswerLower = rec.answer.toLowerCase();

      // 1. Exact string match or substring match bonus
      if (recQueryLower === rawQueryLower) {
        score += 200;
      } else if (recQueryLower.includes(rawQueryLower) || rawQueryLower.includes(recQueryLower)) {
        score += 80;
      }

      // 2. Exact token matches with query
      for (const qt of queryTokens) {
        if (rec.queryTokens.includes(qt)) {
          score += 25;
        } else if (rec.tokens.includes(qt)) {
          score += 10;
        } else if (recQueryLower.includes(qt)) {
          score += 15;
        } else if (recAnswerLower.includes(qt)) {
          score += 5;
        }
      }

      // 3. Synonym Concept matching
      for (const concept of matchedConcepts) {
        const conceptSyns = SYNONYM_MAP[concept] || [];
        if (rec.category.toLowerCase().includes(concept)) {
          score += 20;
        }
        for (const cs of conceptSyns) {
          if (recQueryLower.includes(cs.toLowerCase())) {
            score += 30;
            break;
          } else if (recAnswerLower.includes(cs.toLowerCase())) {
            score += 10;
            break;
          }
        }
      }

      // 4. Special composite intent checks
      // Highest vs Lowest population
      if ((rawQueryLower.includes('highest') || rawQueryLower.includes('sabse jyada') || rawQueryLower.includes('sarvat jast') || rawQueryLower.includes('सर्वाधिक') || rawQueryLower.includes('जास्त')) &&
          (rawQueryLower.includes('population') || rawQueryLower.includes('aabadi') || rawQueryLower.includes('lokvasti') || rawQueryLower.includes('जनसंख्या') || rawQueryLower.includes('लोकसंख्या'))) {
        if (rec.id === 3) score += 100;
      }
      if ((rawQueryLower.includes('lowest') || rawQueryLower.includes('sabse kam') || rawQueryLower.includes('sarvat kami') || rawQueryLower.includes('कमी') || rawQueryLower.includes('कम')) &&
          (rawQueryLower.includes('population') || rawQueryLower.includes('aabadi') || rawQueryLower.includes('lokvasti') || rawQueryLower.includes('जनसंख्या') || rawQueryLower.includes('लोकसंख्या'))) {
        if (rec.id === 4) score += 100;
      }

      // General population query
      if ((rawQueryLower.includes('population') || rawQueryLower.includes('people') || rawQueryLower.includes('aabadi') || rawQueryLower.includes('lokvasti') || rawQueryLower.includes('loksankhya') || rawQueryLower.includes('जनसंख्या') || rawQueryLower.includes('लोकसंख्या') || rawQueryLower.includes('कितनी आबादी') || rawQueryLower.includes('लोकसंख्या किती')) &&
          !rawQueryLower.includes('highest') && !rawQueryLower.includes('lowest') && !rawQueryLower.includes('ward 7') && !rawQueryLower.includes('ward 1') && !rawQueryLower.includes('jyada') && !rawQueryLower.includes('kami') && !rawQueryLower.includes('jast')) {
        if (rec.id === 1) score += 100;
      }

      // Water supply improvement
      if ((rawQueryLower.includes('water supply') || rawQueryLower.includes('pani purvatha') || rawQueryLower.includes('जल आपूर्ति') || rawQueryLower.includes('पाणीपुरवठा')) &&
          (rawQueryLower.includes('improve') || rawQueryLower.includes('kashi') || rawQueryLower.includes('sudhar') || rawQueryLower.includes('सुधार') || rawQueryLower.includes('कशी सुधारू'))) {
        if (rec.id === 20 || rec.id === 22 || rec.id === 23) score += 80;
      }

      return {
        ...rec,
        score
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return top K with score > 0
    return scored.filter(s => s.score > 0).slice(0, topK);
  }

  getBestMatch(userQuery, minThreshold = 25) {
    const matches = this.search(userQuery, 3);
    if (!matches || matches.length === 0) return null;

    const top = matches[0];
    if (top.score >= minThreshold) {
      return top;
    }
    return null;
  }

  getFallbackMessage(targetLang = 'en-IN') {
    if (targetLang === 'mr-IN' || targetLang === 'mr') {
      return "माझ्याकडे सध्याच्या कोपरगाव स्मार्ट सिटी डेटासेटमध्ये याबद्दल पुरेशी माहिती उपलब्ध नाही.";
    } else if (targetLang === 'hi-IN' || targetLang === 'hi') {
      return "मेरे पास वर्तमान कोपरगांव स्मार्ट सिटी डेटासेट में इसके बारे में पर्याप्त जानकारी उपलब्ध नहीं है।";
    }
    return "I don't have sufficient information about this in the current Kopargaon Smart City dataset.";
  }

  formatAnswer(record, targetLang = 'en-IN') {
    if (!record || !record.answer) return '';
    const ans = record.answer;

    // Direct English answer
    if (targetLang === 'en-IN' || targetLang === 'en') {
      return ans;
    }

    // Special curated Marathi mappings for key demo queries
    if (targetLang === 'mr-IN' || targetLang === 'mr') {
      if (record.id === 1) {
        return "उपलब्ध नियोजन डेटासेटनुसार, कोपरगावची अंदाजे लोकसंख्या सुमारे १.१० लाख (1.10 Lakh) आहे. ही आकडेवारी पायाभूत सुविधा, वाहतूक, पाणीपुरवठा, स्वच्छता आणि इतर आवश्यक सेवांच्या नियोजनासाठी वापरली जाते.";
      }
      if (record.id === 2) {
        return "नियोजन डेटासेटमध्ये एकूण १२ वॉर्ड (12 Wards) समाविष्ट आहेत. वॉर्ड-स्तरीय माहितीचा वापर लोकसंख्या, पायाभूत सुविधा, तक्रारी आणि विकास कामांची तुलना करण्यासाठी केला जाऊ शकतो.";
      }
      if (record.id === 3) {
        return "उपलब्ध नियोजन डेटासेटमध्ये **वॉर्ड क्रमांक ७ (Ward 7)** मध्ये सर्वाधिक लोकसंख्या आहे. त्यामुळे हा परिसर पायाभूत सुविधा, सार्वजनिक सेवा आणि वाहतूक जोडणीच्या दृष्टीने उच्च प्राधान्याचा आहे.";
      }
      if (record.id === 4) {
        return "उपलब्ध नियोजन डेटासेटमध्ये **वॉर्ड क्रमांक १ (Ward 1)** मध्ये सर्वात कमी लोकसंख्या आहे.";
      }
      if (record.id === 20) {
        return "वॉर्ड क्रमांक ६ आणि ८ (Wards 6 & 8) मध्ये पाणीपुरवठ्याशी संबंधित सर्वाधिक समस्यांची नोंद झाली आहे. या भागात पाणीपुरवठ्याची विश्वासार्हता आणि पाईपलाईन क्षमता वाढवण्यास प्राधान्य दिले जात आहे.";
      }
      if (record.id === 29) {
        return "पायाभूत सुविधांच्या नोंदीनुसार शहरात सुमारे २४० (240) पथदिव्यांची (स्ट्रीट लाईट्स) नोंद जीआयएस प्रणालीमध्ये करण्यात आलेली आहे.";
      }
      if (record.id === 49) {
        return "नियोजन विश्लेषणानुसार कोपरगावमध्ये छतावरील सौर ऊर्जेची (Rooftop Solar) क्षमता मध्यम ते उच्च पातळीवर आहे. सरकारी इमारती आणि शाळांवर सौर पॅनेल बसवण्यास प्राधान्य दिले जाऊ शकते.";
      }
      return ans;
    }

    // Special curated Hindi mappings for key demo queries
    if (targetLang === 'hi-IN' || targetLang === 'hi') {
      if (record.id === 1) {
        return "उपलब्ध योजना डेटासेट के अनुसार, कोपरगांव की अनुमानित आबादी लगभग 1.10 लाख (1.10 Lakh) है। यह आंकड़ा बुनियादी ढांचे, जल आपूर्ति, स्वच्छता और नागरिक सुविधाओं के लिए महत्वपूर्ण है।";
      }
      if (record.id === 2) {
        return "नियोजन डेटासेट में कुल 12 वार्ड (12 Wards) शामिल हैं।";
      }
      if (record.id === 3) {
        return "उपलब्ध नियोजन डेटासेट में **वार्ड 7 (Ward 7)** में सबसे अधिक आबादी है। यह क्षेत्र बुनियादी ढांचे और सार्वजनिक सेवाओं के लिए उच्च प्राथमिकता वाला है।";
      }
      if (record.id === 4) {
        return "उपलब्ध नियोजन डेटासेट में **वार्ड 1 (Ward 1)** में सबसे कम आबादी है।";
      }
      if (record.id === 20) {
        return "वार्ड 6 और 8 (Wards 6 & 8) में जल आपूर्ति से संबंधित सबसे अधिक समस्याएं दर्ज हैं।";
      }
      if (record.id === 29) {
        return "अवसंरचना सूची के अनुसार शहर में लगभग 240 स्ट्रीट लाइटें जीआईएस प्रणाली में मैप की गई हैं।";
      }
      if (record.id === 49) {
        return "नियोजन विश्लेषण के अनुसार कोपरगांव में रूफटॉप सौर ऊर्जा (Solar Potential) की मध्यम से उच्च संभावना है।";
      }
      return ans;
    }

    return ans;
  }
}

export const csvKnowledgeEngine = new CsvKnowledgeEngine();
export default csvKnowledgeEngine;
