import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, Mic, RefreshCw, Trash2, Send, Volume2, Globe, MapPin } from 'lucide-react';
import { aiPlannerService, ttsService } from '../../services/api';
import toast from 'react-hot-toast';

// Detect explicit user language switch requests
export const detectLanguageSwitchRequest = (text) => {
  if (!text || !text.trim()) return null;
  const lower = text.toLowerCase().trim().replace(/[!?.,;]/g, '');

  // 1. Marathi Switch Request
  const marathiSwitchTerms = [
    'can we talk in marathi', 'can we speak in marathi', 'can we speak marathi', 'can we talk marathi',
    'speak in marathi', 'talk in marathi', 'speak marathi', 'talk marathi',
    'switch to marathi', 'in marathi please', 'reply in marathi', 'marathi please', 'in marathi',
    'marathi madhe bol', 'marathi madhe bola', 'marathit bola', 'marathit bol', 'marathi madhe',
    'मराठीत बोलू शकतो का', 'मराठीत बोलायचं आहे', 'मराठीत बोलायचे आहे', 'मला मराठीत बोलायचं आहे', 'मला मराठीत बोलायचे आहे',
    'मराठीत बोलूया', 'मराठीत बोला', 'मराठीत बोल', 'मराठी मध्ये बोला', 'मराठी मध्ये बोल'
  ];
  if (marathiSwitchTerms.some(t => lower === t || lower.includes(t))) {
    return 'mr';
  }

  // 2. Hindi Switch Request
  const hindiSwitchTerms = [
    'can we talk in hindi', 'can we speak in hindi', 'can we speak hindi', 'can we talk hindi',
    'speak in hindi', 'talk in hindi', 'speak hindi', 'talk hindi',
    'switch to hindi', 'in hindi please', 'reply in hindi', 'hindi please', 'in hindi',
    'hindi me baat karo', 'hindi mein baat karo', 'hindi me bolo', 'hindi mein bolo', 'hindi mein baat karein',
    'हिंदी में बात कर सकते हैं क्या', 'हिंदी में बात कर सकते हैं', 'हिंदी में बात करो', 'हिंदी में बोलिए', 'हिंदी में बताओ'
  ];
  if (hindiSwitchTerms.some(t => lower === t || lower.includes(t))) {
    return 'hi';
  }

  // 3. English Switch Request
  const englishSwitchTerms = [
    'can we talk in english', 'can we speak in english', 'can we speak english', 'can we talk english',
    'speak in english', 'talk in english', 'speak english', 'talk english',
    'switch to english', 'in english please', 'reply in english', 'english please', 'in english',
    'english me baat karo', 'english madhe bola', 'इंग्रजीत बोला', 'इंग्लिश मध्ये बोला'
  ];
  if (englishSwitchTerms.some(t => lower === t || lower.includes(t))) {
    return 'en';
  }

  return null;
};

// Auto-detect language from text
export const detectLanguageFromText = (text) => {
  if (!text || !text.trim()) return 'en';

  // Check language switch requests first!
  const switchTarget = detectLanguageSwitchRequest(text);
  if (switchTarget) {
    return switchTarget;
  }

  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const lowerText = text.toLowerCase();

  if (devanagariCount > 0) {
    const marathiMarkers = [
      'नमस्कार', 'शुभ सकाळ', 'शुभ संध्याकाळ', 'तुम्ही', 'कसे', 'कसा', 'कशी', 'आहात', 'आहेस', 'आहे', 'आहेत',
      'होते', 'होता', 'होती', 'नाही', 'नाहीत', 'छान', 'बरे', 'बारे', 'मला', 'माझ्या', 'माझे', 'माझी', 'आमच्या',
      'आपल्या', 'कोपरगाव', 'कोपरगावमध्ये', 'मध्ये', 'शहरात', 'वॉर्डमध्ये', 'रस्ता', 'रस्ते', 'रस्त्याची', 'रस्त्यांची',
      'पाणी', 'पाण्याची', 'शाळा', 'प्रकल्प', 'प्रकल्पांची', 'तक्रार', 'तक्रारी', 'सुविधा', 'नगरपालिका', 'कुठे', 'किती',
      'कोणते', 'कोणता', 'कोणती', 'काय', 'कधी', 'द्या', 'शोधा', 'सांगा', 'दाखवा', 'चालू', 'सुरू', 'प्रलंबित',
      'रुग्णालय', 'दवाखाना', 'आरोग्य', 'वाहतूक', 'सांडपाणी', 'ड्रेनेज', 'कचरा', 'दिवे', 'खांब', 'समस्या', 'विकास',
      'कामे', 'काम', 'माहिती'
    ];
    const hindiMarkers = [
      'नमस्ते', 'शुभ प्रभात', 'शुभ दोपहर', 'शुभ संध्या', 'आप', 'तुम', 'कैसे', 'कैसा', 'कैसी', 'हैं', 'है', 'हो',
      'था', 'थी', 'थे', 'नहीं', 'बढ़िया', 'अच्छा', 'मुझे', 'मेरा', 'मेरी', 'मेरे', 'हमारा', 'हमारे', 'हमारी',
      'कोपरगांव', 'कोपरगांव में', 'में', 'शहर में', 'वार्ड में', 'सड़क', 'सड़कें', 'सड़कों', 'पानी', 'स्कूल',
      'परियोजना', 'परियोजनाएं', 'शिकायत', 'शिकायतें', 'सुविधाएं', 'कहाँ', 'कितना', 'कितने', 'कितनी', 'कौनसा',
      'कौनसी', 'कौनसे', 'क्या', 'कब', 'दीजिए', 'खोजो', 'बताओ', 'बताइए', 'दिखाओ', 'दिखाइए', 'शुरू',
      'अस्पताल', 'स्वास्थ्य', 'जल', 'निकासी', 'कूड़ा', 'रोशनी', 'समस्या'
    ];

    let marathiScore = 0;
    let hindiScore = 0;
    marathiMarkers.forEach(word => { if (text.includes(word)) marathiScore++; });
    hindiMarkers.forEach(word => { if (text.includes(word)) hindiScore++; });

    // Check Marathi specific letters/affixes
    if (text.includes('ळ') || text.includes('च्या') || text.includes('ची') || text.includes('चे') || text.includes('चा') || text.includes('ून') || text.includes('तील')) {
      marathiScore += 2;
    }

    if (marathiScore > hindiScore) return 'mr';
    if (hindiScore > marathiScore) return 'hi';
    return 'mr'; // Default Devanagari in Kopargaon context to Marathi
  }

  // Transliteration logic
  const marathiTrans = ['mala', 'majha', 'majhya', 'aamhi', 'tumhi', 'kasa', 'kashi', 'kase', 'ahat', 'ahes', 'ahe', 'ahet', 'pani', 'rasta', 'rastyachi', 'prakalp', 'takrar', 'sang', 'dakhav', 'kiti', 'kuthe', 'kay', 'namaskar', 'madhe', 'suru', 'shala', 'chhan', 'bare'];
  const hindiTrans = ['mujhe', 'mera', 'meri', 'mere', 'hum', 'aap', 'kaise', 'kaisa', 'kaisi', 'hain', 'hai', 'ho', 'paani', 'sadak', 'shikayat', 'batao', 'dikhao', 'kitna', 'kitne', 'kahan', 'kya', 'namaste', 'shukriya', 'dhanyawad', 'achha', 'badhiya', 'shuru', 'chahiye'];

  let mTransScore = 0;
  let hTransScore = 0;
  marathiTrans.forEach(w => { if (new RegExp('\\b' + w + '\\b', 'i').test(lowerText)) mTransScore++; });
  hindiTrans.forEach(w => { if (new RegExp('\\b' + w + '\\b', 'i').test(lowerText)) hTransScore++; });

  if (mTransScore > hTransScore) return 'mr';
  if (hTransScore > mTransScore) return 'hi';
  return 'en';
};

// Helper to check if a query is purely conversational
export const getConversationalResponse = (query, lang) => {
  if (!query) return null;
  const lower = query.toLowerCase().replace(/[!?.,;]/g, '').trim();
  const qLang = lang || detectLanguageFromText(query);
  const isMr = qLang === 'mr' || qLang === 'mr-IN';
  const isHi = qLang === 'hi' || qLang === 'hi-IN';

  // Do NOT intercept civic queries that need Smart City / GIS / Database data
  const civicKeywords = [
    'ward', 'project', 'pothole', 'complaint', 'hospital', 'school', 'drainage', 'scada', 'budget',
    'water supply', 'pipe', 'repair', 'schedule', 'status', 'contractor', 'zone', 'gis', 'map',
    'वॉर्ड', 'प्रकल्प', 'खड्डे', 'तक्रार', 'रुग्णालय', 'शाळा', 'ड्रेनेज', 'पाणीपुरवठा', 'पाणी', 'रस्ता',
    'रस्ते', 'वेळापत्रक', 'काम', 'बजेट', 'वार्ड', 'परियोजना', 'शिकायत', 'अस्पताल', 'स्कूल', 'सड़क'
  ];
  if (civicKeywords.some(k => lower.includes(k))) {
    return null;
  }

  // 0. USER INTRODUCTION / NAME
  const nameMatch = query.match(/(?:my name is|i am|i'm|myself|call me|this is)\s+([a-zA-Z\u0900-\u097F]+)/i)
    || query.match(/(?:माझे नाव|माझं नाव|मी)\s+([a-zA-Z\u0900-\u097F]+)\s*(?:आहे)?/i)
    || query.match(/(?:मेरा नाम|मैं)\s+([a-zA-Z\u0900-\u097F]+)\s*(?:हूँ|है)?/i);

  if (nameMatch && !lower.includes('complaint') && !lower.includes('project') && !lower.includes('water')) {
    const rawName = nameMatch[1].trim();
    const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    if (isMr) return `नमस्कार ${cleanName}! 😊 तुम्हाला भेटून आनंद झाला. आज मी कोपरगावच्या नागरी सेवा, विकास प्रकल्प किंवा तक्रारींबाबत आपली काय मदत करू शकतो?`;
    if (isHi) return `नमस्ते ${cleanName}! 😊 आपसे मिलकर खुशी हुई। आज मैं कोपरगांव की नागरिक सेवाओं, विकास परियोजनाओं या शिकायतों में आपकी क्या सहायता कर सकता हूँ?`;
    return `Nice to meet you, ${cleanName}! 😊 How can I help you with Kopargaon citizen services today?`;
  }

  // 1. TALK / CAN WE TALK / LET'S TALK / CHAT / SPEAK
  const talkPatterns = [
    'can we talk', 'lets talk', "let's talk", 'can you talk', 'talk to me', 'can we chat', 'talk with me',
    'can you speak', 'speak with me', 'talk', 'chat', 'speak',
    'आपण बोलू शकतो का', 'आपण बोलू का', 'माझ्याशी बोलाल का', 'माझ्याशी बोला', 'बोलूया का', 'बोलू शकतो का', 'बोलू शकाल का', 'बोला',
    'क्या हम बात कर सकते हैं', 'बात कर सकते हैं क्या', 'बात करो', 'मुझसे बात करो', 'बात करें', 'बात कर सकते हो',
    'baat karo', 'bolu shakta ka', 'boluya'
  ];
  if (talkPatterns.some(t => lower === t || lower.startsWith(t + ' ') || lower.endsWith(' ' + t) || lower.includes(t))) {
    if (isMr) return "हो नक्की! 😊 मी तुमच्याशी बोलायला तयार आहे. तुम्ही मला कोपरगावच्या नागरी सेवा, तक्रारी, पाणीपुरवठा, रस्ते, विकास प्रकल्प किंवा इतर कोणत्याही विषयावर विचारू शकता.";
    if (isHi) return "बिल्कुल! 😊 मैं आपसे बात करने के लिए तैयार हूँ। आप मुझसे कोपरगांव की नागरिक सेवाओं, शिकायतों, जल आपूर्ति, सड़कों, विकास परियोजनाओं या किसी भी विषय पर पूछ सकते हैं।";
    return "Of course! 😊 I'm here to help. You can ask me about Kopargaon civic services, complaints, water supply, roads, projects, or anything else you'd like to discuss.";
  }

  // 2. CAN YOU HELP ME / HELP
  const helpPatterns = [
    'can you help me', 'can you help', 'help me', 'i need help', 'need help', 'could you help me', 'please help me',
    'मला मदत करू शकता का', 'मला मदत हवी आहे', 'मदत कराल का', 'मदत करा', 'मदत हवी आहे', 'मदत',
    'क्या आप मेरी मदद कर सकते हैं', 'मेरी मदद करो', 'मुझे मदद चाहिए', 'मदद कर सकते हो', 'मदद करो', 'मदद', 'सहायता',
    'madat kara', 'madad karo'
  ];
  if (helpPatterns.some(h => lower === h || lower.startsWith(h + ' ') || lower.endsWith(' ' + h) || lower.includes(h))) {
    if (isMr) return "नक्कीच! 😊 तुम्हाला कशाबद्दल मदत हवी आहे ते मला सांगा. मी पाणीपुरवठा, रस्ते, विकास प्रकल्प किंवा तक्रारींबद्दल माहिती देऊ शकतो.";
    if (isHi) return "बिल्कुल! 😊 बताइए आपको किस विषय में सहायता चाहिए? मैं जल आपूर्ति, सड़क, विकास कार्यों या शिकायतों में आपकी मदद कर सकता हूँ।";
    return "Absolutely! 😊 Tell me what you need help with. I can assist you with civic services, project tracking, water supply schedules, or grievances.";
  }

  // 3. GREETINGS (hello, hi, hey, good morning, etc.)
  const greetings = [
    'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'good day', 'namaste', 'namaskar', 'suprabhat', 'pranam',
    'नमस्कार', 'नमस्ते', 'शुभ सकाळ', 'शुभ प्रभात', 'शुभ दुपार', 'शुभ संध्याकाळ', 'हाय', 'हॅलो', 'हैलो'
  ];
  if (greetings.some(g => lower === g || lower.startsWith(g + ' ') || lower.endsWith(' ' + g))) {
    if (isMr) return "नमस्कार! 👋 मी कोपरगाव स्मार्ट सिटी AI नागरिक सहाय्यक आहे. आज मी आपली काय मदत करू?";
    if (isHi) return "नमस्ते! 👋 मैं कोपरगांव स्मार्ट सिटी AI नागरिक सहायक हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?";
    return "Hello! 👋 How can I help you today?";
  }

  // 4. HOW ARE YOU
  const howAreYou = [
    'how are you', 'how are u', 'how r u', 'how are you doing', 'how do you do', 'how is it going',
    'तुम्ही कसे आहात', 'कसे आहात', 'कसा आहेस', 'कशी आहेस', 'काय चाललंय',
    'आप कैसे हैं', 'आप कैसे हो', 'कैसे हो', 'क्या हाल है',
    'kaise ho', 'kase ahat', 'kasa kay'
  ];
  if (howAreYou.some(p => lower === p || lower.startsWith(p + ' ') || lower.endsWith(' ' + p) || lower.includes(p))) {
    if (isMr) return "मी एकदम मजेत आहे! 😊 कोपरगावच्या नागरिकांची सेवा करण्यासाठी मी सदैव तत्पर आहे. आज मी आपली काय मदत करू?";
    if (isHi) return "मैं बिल्कुल ठीक हूँ! 😊 कोपरगांव के नागरिकों की सहायता के लिए मैं हमेशा तैयार हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?";
    return "I'm doing great! 😊 How can I help you with Kopargaon today?";
  }

  // 5. WHAT CAN YOU DO / CAPABILITIES
  const whatCanYouDo = [
    'what can you do', 'what can u do', 'what are your capabilities', 'what can i ask', 'how can you help', 'how can you help me', 'what do you do',
    'तू काय करू शकतो', 'तू काय करू शकतोस', 'तुम्ही काय करू शकता', 'तुम्ही काय मदत करू शकता', 'मला काय मदत करू शकता', 'काय विचारू शकतो',
    'तुम क्या कर सकते हो', 'आप क्या कर सकते हैं', 'आप क्या मदद कर सकते हैं', 'क्या मदद कर सकते हो', 'क्या पूछ सकता हूँ'
  ];
  if (whatCanYouDo.some(w => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w) || lower.includes(w))) {
    if (isMr) return "मी कोपरगावमधील नागरी तक्रारींची स्थिती, पाणीपुरवठा वेळापत्रक, चालू विकास प्रकल्प, रस्ता दुरुस्ती, महानगरपालिका सेवा आणि जीआयएस माहिती संदर्भात मदत करू शकतो. 🤖";
    if (isHi) return "मैं कोपरगांव में नागरिक शिकायतों, जल आपूर्ति समय सारणी, विकास परियोजनाओं, सड़क मरम्मत और नगर पालिका सेवाओं में सहायता कर सकता हूँ। 🤖";
    return "I can help you with civic complaints, water supply information, development projects, road issues, municipal services, GIS information, and other Kopargaon-related questions. 🤖";
  }

  // 6. THANK YOU / THANKS
  const thanks = [
    'thank you', 'thanks', 'thank u', 'thx', 'thank you so much', 'thanks a lot', 'many thanks',
    'धन्यवाद', 'खूप धन्यवाद', 'खूप खूप धन्यवाद', 'आभार', 'शुक्रिया', 'बहुत शुक्रिया', 'बहुत बहुत धन्यवाद',
    'dhanyawad', 'shukriya', 'aabhar'
  ];
  if (thanks.some(t => lower === t || lower.startsWith(t + ' ') || lower.endsWith(' ' + t) || lower.includes(t))) {
    if (isMr) return "आपले मनःपूर्वक स्वागत आहे! 😊 आणखी काही मदत हवी असल्यास नक्की विचारा.";
    if (isHi) return "आपका बहुत-बहुत स्वागत है! 😊 अगर आपको कोई और सहायता चाहिए तो जरूर बताएं।";
    return "You're welcome! 😊 I'm always here if you need help.";
  }

  // 7. BYE / GOODBYE
  const bye = [
    'bye', 'goodbye', 'good bye', 'bye bye', 'see you', 'see you later', 'take care', 'have a nice day',
    'अलविदा', 'पुन्हा भेटू', 'बाय', 'बाय बाय', 'निरोप', 'काळजी घ्या', 'फिर मिलेंगे',
    'alvida', 'punha bhetu'
  ];
  if (bye.some(b => lower === b || lower.startsWith(b + ' ') || lower.endsWith(' ' + b) || lower.includes(b))) {
    if (isMr) return "निरोप! आपला दिवस आनंदाचा जावो. 👋 कोपरगाव स्मार्ट सिटी संदर्भात कधीही पुन्हा संपर्क साधा!";
    if (isHi) return "अलविदा! आपका दिन शुभ हो। 👋 कोपरगांव स्मार्ट सिटी से संबंधित किसी भी सहायता के लिए कभी भी पुनः संपर्क करें!";
    return "Goodbye! Have a wonderful day ahead. 👋 Feel free to reach out whenever you need assistance with Kopargaon Smart City services!";
  }

  // 8. WHO ARE YOU / IDENTITY
  const whoAreYou = [
    'who are you', 'who r u', 'what is your name', 'whats your name', 'tell me about yourself', 'who made you',
    'तू कोण आहेस', 'तुम्ही कोण आहात', 'तुमची ओळख', 'तुमचे नाव काय',
    'तुम कौन हो', 'तुम्हारा नाम क्या है', 'आप कौन हैं', 'अपना परिचय दो'
  ];
  if (whoAreYou.some(w => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w) || lower.includes(w))) {
    if (isMr) return "मी **कोपरगाव स्मार्ट सिटी AI नागरिक सहाय्यक** आहे. 🤖 मी कोपरगाव नगर परिषदेच्या जीआयएस डेटाबेस, विकास प्रकल्प व नागरी सेवांशी थेट जोडलेला अधिकृत AI सहाय्यक आहे.";
    if (isHi) return "मैं **कोपरगांव स्मार्ट सिटी AI नागरिक सहायक** हूँ। 🤖 मैं कोपरगांव नगर परिषद के जीआईएस डेटाबेस, विकास परियोजनाओं और नागरिक सेवाओं से सीधे जुड़ा हुआ डिजिटल सहायक हूँ।";
    return "I am the **Kopargaon Smart City AI Citizen Assistant**. 🤖 I am the official digital assistant connected to Kopargaon Municipal GIS databases, project registries, and civic grievance systems.";
  }

  // 9. LANGUAGE SWITCH / MULTI-LINGUAL CONVERSATION
  const marathiSwitch = [
    'can we talk in marathi', 'can we speak in marathi', 'speak in marathi', 'talk in marathi', 'marathi please',
    'can we talk marathi madhe', 'marathi madhe bola', 'marathit bola', 'मराठीत बोला', 'मराठीत सांगा', 'मराठीत उत्तर द्या',
    'आपण मराठीत बोलू शकतो का', 'आपण माझ्याशी मराठीत बोलू शकता का', 'माझ्याशी मराठीत बोला'
  ];
  if (marathiSwitch.some(m => lower === m || lower.includes(m))) {
    return "हो नक्की! आपण मराठीत बोलू शकतो. 😊 मी कोपरगाव स्मार्ट सिटी AI सहाय्यक आहे. तुम्हाला कशाबद्दल माहिती हवी आहे?";
  }

  const hindiSwitch = [
    'hindi me baat karo', 'hindi mein baat karo', 'hindi me bolo', 'hindi mein bolo', 'हिंदी में बात करो', 'हिंदी में बोलो',
    'talk in hindi', 'speak in hindi', 'hindi please'
  ];
  if (hindiSwitch.some(h => lower === h || lower.includes(h))) {
    return "हाँ बिल्कुल! हम हिंदी में बात कर सकते हैं। 😊 मैं कोपरगांव स्मार्ट सिटी AI सहायक हूँ। आप मुझसे क्या जानना चाहते हैं?";
  }

  const englishSwitch = [
    'can we talk in english', 'can we speak in english', 'speak in english', 'talk in english', 'english please',
    'इंग्रजीत बोला', 'इंग्लिश मध्ये बोला', 'अंग्रेजी में बात करो'
  ];
  if (englishSwitch.some(e => lower === e || lower.includes(e))) {
    return "Sure! We can communicate in English. 😊 I am your Kopargaon Smart City AI Assistant. How can I assist you today?";
  }

  // 10. WEATHER / CLIMATE
  const weather = ['weather', 'temperature', 'climate', 'हवामान', 'तापमान', 'पाऊस', 'मौसम'];
  if (weather.some(w => lower.includes(w))) {
    if (isMr) return "आज कोपरगावमध्ये हवामान सामान्य व आल्हाददायक आहे. तापमान सुमारे २८°C ते ३२°C दरम्यान राहण्याची शक्यता आहे. 🌤️";
    if (isHi) return "आज कोपरगांव में मौसम सामान्य और सुहावना है। तापमान लगभग 28°C से 32°C के बीच रहने की संभावना है। 🌤️";
    return "The weather in Kopargaon today is clear and pleasant with temperatures around 28°C to 32°C. 🌤️";
  }

  return null;
};

// Strip markdown for TTS
const stripMarkdownForTTS = (text) => {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/[_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*•✓✕⭐📊📋📍💡🚨🏥🤖🚧🟣🔴🟠🟢]\s?/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const LANG_CONFIG = {
  'en': { label: 'EN', name: 'English' },
  'hi': { label: 'हि', name: 'हिंदी' },
  'mr': { label: 'मरा', name: 'मराठी' },
  'en-IN': { label: 'EN', name: 'English' },
  'hi-IN': { label: 'हि', name: 'हिंदी' },
  'mr-IN': { label: 'मरा', name: 'मराठी' }
};

const CitizenAiAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'नमस्कार! मी कोपरगाव स्मार्ट सिटी AI नागरिक सहाय्यक आहे. तुम्ही मला तक्रारीचा स्टेटस, रस्ते, पाणी, सांडपाणी, विजेचे खांब, किंवा तुमच्या वॉर्डातील विकास कामांबद्दल प्रश्न विचारू शकता.\n\nHello! I am your Kopargaon Smart City AI Citizen Assistant. Ask me about civic complaints, water supply, road repairs, street lights, or ongoing projects in your ward.',
      data: null,
      lang: 'mr'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('mr');
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const chatEndRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const stopSpeaking = () => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) { }
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  const unlockAudioEngine = () => {
    try {
      // 1. Resume AudioContext
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!window.__appAudioCtx) {
          window.__appAudioCtx = new AudioCtx();
        }
        if (window.__appAudioCtx.state === 'suspended') {
          window.__appAudioCtx.resume();
        }
      }

      // 2. Pre-unlock HTML5 Audio element with silent data-URI
      if (!audioRef.current) {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silentAudio.volume = 0.01;
        silentAudio.play().then(() => {
          silentAudio.pause();
        }).catch(() => { });
        audioRef.current = silentAudio;
      }

      // 3. Unlock SpeechSynthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
    } catch (e) { }
  };

  const fallbackBrowserTTS = (text, targetLang, msgId) => {
    if (!('speechSynthesis' in window)) {
      setSpeakingMsgId(null);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        try {
          const cleanText = stripMarkdownForTTS(text);
          const utterance = new SpeechSynthesisUtterance(cleanText);
          window.__activeUtterance = utterance; // Prevent Chrome V8 garbage-collection bug

          const isMarathi = targetLang === 'mr' || targetLang === 'mr-IN';
          const isHindi = targetLang === 'hi' || targetLang === 'hi-IN';
          const isEnglish = !isMarathi && !isHindi;
          const cleanLang = isMarathi ? 'mr-IN' : (isHindi ? 'hi-IN' : 'en-IN');

          utterance.lang = cleanLang;
          utterance.volume = 1;
          utterance.rate = 0.95;
          utterance.pitch = 1;

          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            let match = null;

            if (isEnglish) {
              // 1. English Male Voice matching
              match = voices.find(v => v.lang.toLowerCase().startsWith('en') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('mark') || v.name.toLowerCase().includes('george') || v.name.toLowerCase().includes('rishi'))) ||
                voices.find(v => v.lang === cleanLang || v.lang.replace('_', '-').toLowerCase() === cleanLang.toLowerCase());
            } else if (isMarathi) {
              // 2. Marathi Female Voice matching (Devanagari text sent unchanged)
              match = voices.find(v => v.lang.toLowerCase().startsWith('mr')) ||
                voices.find(v => v.lang.toLowerCase().startsWith('hi') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('hindi'))) ||
                voices.find(v => v.lang.toLowerCase().startsWith('hi'));
            } else {
              // 3. Hindi Voice matching
              match = voices.find(v => v.lang.toLowerCase().startsWith('hi')) ||
                voices.find(v => v.lang === cleanLang);
            }

            // 4. General Indian voice fallback (en-IN)
            if (!match) {
              match = voices.find(v => v.lang.toLowerCase().startsWith('en-in') || v.name.toLowerCase().includes('india'));
            }

            if (match) {
              utterance.voice = match;
              console.log(`🔊 Assigned TTS voice: ${match.name} (${match.lang}) for language: ${cleanLang}`);
            }
          }

          utterance.onstart = () => {
            console.log('🔊 Speaking aloud automatically (SpeechSynthesis active)');
            setSpeakingMsgId(msgId || null);
          };
          utterance.onend = () => {
            setSpeakingMsgId(null);
            window.__activeUtterance = null;
          };
          utterance.onerror = (e) => {
            console.warn('SpeechSynthesis error:', e.error || e);
            setSpeakingMsgId(null);
            window.__activeUtterance = null;
            // If Chrome failed on mr-IN language tag, retry with Hindi Devanagari tag
            if (isMarathi && e.error === 'language-unavailable') {
              try {
                const retryUtterance = new SpeechSynthesisUtterance(cleanText);
                retryUtterance.lang = 'hi-IN';
                window.__activeUtterance = retryUtterance;
                window.speechSynthesis.speak(retryUtterance);
              } catch (retryErr) { }
            }
          };

          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);

          setTimeout(() => {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }, 100);
        } catch (err) {
          console.error("SpeechSynthesis runtime error:", err);
          setSpeakingMsgId(null);
        }
      }, 50);
    } catch (e) {
      setSpeakingMsgId(null);
    }
  };

  const speakText = async (text, langCode, msgId, directAudioUrl = null) => {
    stopSpeaking();
    const rawLang = langCode || language;
    const targetLang = (rawLang === 'mr' || rawLang === 'mr-IN')
      ? 'mr-IN'
      : ((rawLang === 'hi' || rawLang === 'hi-IN') ? 'hi-IN' : 'en-IN');

    const isMarathi = targetLang === 'mr-IN';
    const isHindi = targetLang === 'hi-IN';

    // Debugging logs
    console.log('[TTS] Provider: ElevenLabs');
    console.log(`[TTS] Target language: ${targetLang}`);

    try {
      let audioUrl = directAudioUrl;
      let needsRevoke = false;

      if (!audioUrl) {
        audioUrl = await ttsService.speak(text, targetLang);
        if (audioUrl) needsRevoke = true;
      }

      if (!audioUrl) {
        fallbackBrowserTTS(text, targetLang, msgId);
        return;
      }

      let audio = audioRef.current;
      if (!audio) {
        audio = new Audio();
        audioRef.current = audio;
      }

      audio.src = audioUrl;
      audio.volume = 1;

      audio.onplay = () => {
        console.log('[TTS] Playing ElevenLabs audio');
        setSpeakingMsgId(msgId || null);
      };
      audio.onended = () => {
        setSpeakingMsgId(null);
        if (needsRevoke) URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        console.warn('[TTS] ElevenLabs audio playback failed. Triggering browser SpeechSynthesis fallback.');
        setSpeakingMsgId(null);
        if (needsRevoke) URL.revokeObjectURL(audioUrl);
        fallbackBrowserTTS(text, targetLang, msgId);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('[TTS] Autoplay prevented or failed, triggering browser SpeechSynthesis fallback:', error.message);
          fallbackBrowserTTS(text, targetLang, msgId);
        });
      }
    } catch (err) {
      fallbackBrowserTTS(text, targetLang, msgId);
    }
  };

  const suggestedQueries = [
    "How can I report a road problem?",
    "Show ongoing development projects in my area",
    "How can I register a water complaint?",
    "Where can I see nearby public facilities?",
    "What infrastructure projects are planned in my ward?",
    "माझ्या परिसरातील रस्त्याची तक्रार कशी करायची?",
    "माझ्या वॉर्डमध्ये कोणते विकास प्रकल्प सुरू आहेत?",
    "मेरी शिकायत का स्टेटस क्या है?",
    "Water supply schedule in Ward 4"
  ];

  const handleSend = async (queryText, overrideLang) => {
    unlockAudioEngine();
    const query = queryText || input;
    if (!query.trim()) return;

    const queryLang = overrideLang || detectLanguageFromText(query);
    setLanguage(queryLang);

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsTyping(true);

    stopSpeaking();

    // ─── 1. Conversational Intent Layer (Immediate Natural Conversation) ───
    const convAnswer = getConversationalResponse(query, queryLang);
    if (convAnswer) {
      setTimeout(() => {
        const aiMsgId = Date.now() + 1;
        const aiMsg = {
          id: aiMsgId,
          sender: 'ai',
          text: convAnswer,
          data: null,
          lang: queryLang
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
        const normalizedLang = (queryLang === 'mr' || queryLang === 'mr-IN') ? 'mr-IN' : ((queryLang === 'hi' || queryLang === 'hi-IN') ? 'hi-IN' : 'en-IN');
        speakText(convAnswer, normalizedLang, aiMsgId, null).catch(err => {
          console.warn("Non-blocking TTS execution failed:", err);
        });
      }, 200);
      return;
    }

    // ─── 2. Civic / Smart City / PostGIS / MCP Data Flow ───
    try {
      const chatHistory = messages
        .filter(m => !m.error && m.text)
        .slice(-10)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));
      chatHistory.push({ role: 'user', content: query });

      const requestPayload = {
        query: query,
        message: query,
        language: queryLang,
        userType: 'citizen',
        role: 'citizen',
        userId: null,
        location: null,
        conversation: chatHistory
      };
      console.log("🚀 AI REQUEST:", requestPayload);

      const res = await aiPlannerService.queryAI(query, queryLang, 'citizen', requestPayload);

      // Required console logging
      console.log("AI Assistant API response:", res);

      let answer = null;
      if (res) {
        const candidates = [
          res.answer,
          res.message,
          res.response,
          res.text,
          res.output,
          res.data?.answer,
          res.data?.message,
          res.data?.response,
          res.data?.text,
          res.data?.output
        ];

        for (const cand of candidates) {
          if (cand && typeof cand === 'string') {
            const trimmed = cand.trim();
            const lowerCand = trimmed.toLowerCase();
            if (trimmed !== '' &&
              lowerCand !== 'unavailable' &&
              lowerCand !== 'undefined' &&
              lowerCand !== 'null' &&
              lowerCand !== '[object object]' &&
              trimmed !== 'Analysis completed.') {
              answer = trimmed;
              break;
            }
          }
        }
      }

      console.log("AI Assistant normalized answer:", answer);

      let finalAnswer = answer;
      if (!finalAnswer) {
        // Check if conversational first before showing database fallback
        const convAnswer = getConversationalResponse(query, queryLang);
        if (convAnswer) {
          finalAnswer = convAnswer;
        } else {
          // ONLY show fallback for genuinely unavailable civic queries
          if (queryLang === 'mr' || queryLang === 'mr-IN') {
            finalAnswer = "माफ करा, ही माहिती माझ्या Smart City डेटाबेसमध्ये उपलब्ध नाही.";
          } else if (queryLang === 'hi' || queryLang === 'hi-IN') {
            finalAnswer = "माफ़ कीजिए, यह जानकारी मेरे Smart City डेटाबेस में उपलब्ध नहीं है।";
          } else {
            finalAnswer = "Sorry, I don't have this information in the Smart City database.";
          }
        }
      }

      const aiMsgId = Date.now() + 1;
      const aiMsg = {
        id: aiMsgId,
        sender: 'ai',
        text: finalAnswer,
        data: res,
        lang: queryLang
      };
      setMessages(prev => [...prev, aiMsg]);

      const directAudio = res?.audio || res?.data?.audio || null;
      const normalizedLang = (queryLang === 'mr' || queryLang === 'mr-IN') ? 'mr-IN' : ((queryLang === 'hi' || queryLang === 'hi-IN') ? 'hi-IN' : 'en-IN');
      speakText(aiMsg.text, normalizedLang, aiMsgId, directAudio).catch(err => {
        console.warn("Non-blocking TTS execution failed:", err);
      });
    } catch (err) {
      console.error(err);

      // If conversational, provide normal conversational reply even during network error
      const convFallback = getConversationalResponse(query, queryLang);
      let fallbackText = convFallback;

      if (!fallbackText) {
        // If civic query, inform that service is reconnecting or unavailable
        if (queryLang === 'mr' || queryLang === 'mr-IN') {
          fallbackText = "माफ करा, ही माहिती मिळवण्यात अडचण येत आहे. कृपया पुन्हा प्रयत्न करा.";
        } else if (queryLang === 'hi' || queryLang === 'hi-IN') {
          fallbackText = "माफ़ कीजिए, जानकारी प्राप्त करने में असमर्थ। कृपया पुनः प्रयास करें।";
        } else {
          fallbackText = "Sorry, could not retrieve information at the moment. Please try again.";
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: fallbackText,
        error: !convFallback,
        lang: queryLang
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = () => {
    unlockAudioEngine();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    stopSpeaking();

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    
    // Determine recognition language: Default to en-IN for universal English & civic term recognition
    // If the active language is explicitly Marathi or Hindi, use that specific locale
    let sttLang = 'en-IN';
    if (language === 'mr' || language === 'mr-IN') {
      sttLang = 'mr-IN';
    } else if (language === 'hi' || language === 'hi-IN') {
      sttLang = 'hi-IN';
    }

    recognition.lang = sttLang;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      const displayLang = sttLang === 'mr-IN' ? 'मराठी' : (sttLang === 'hi-IN' ? 'हिंदी' : 'English');
      toast.loading(`🎤 Listening... (${displayLang})`, { id: 'voice-toast' });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (!transcript.trim()) {
        toast.error('No speech detected.', { id: 'voice-toast' });
        return;
      }

      // Detect language from the actual recognized text without translating
      const detectedLang = detectLanguageFromText(transcript);
      console.log(`🎤 [STT TRANSCRIPT]: "${transcript}" | Detected Language: ${detectedLang}`);
      setLanguage(detectedLang);
      setInput(transcript);

      toast.success(`✅ "${transcript}"`, { id: 'voice-toast' });
      // Pass the raw recognized text as-is to the existing AI query function
      setTimeout(() => handleSend(transcript, detectedLang), 200);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast.error(`Speech recognition failed: ${event.error}`, { id: 'voice-toast' });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleClearHistory = () => {
    stopSpeaking();
    setMessages([messages[0]]);
    toast.success('Conversation history reset');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-slate-800 p-5 rounded-2xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Citizen AI Intelligence Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center space-x-2">
            <Bot className="w-6 h-6 text-emerald-400" />
            <span>AI Citizen Assistant</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time civic intelligence, complaint updates, water & road project status.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 flex items-center space-x-1.5">
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>Language: {LANG_CONFIG[language]?.name || language}</span>
          </div>

          <button
            onClick={handleClearHistory}
            className="px-3.5 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Full-Width Chat Workspace */}
      <div className="flex flex-col h-[calc(100vh-250px)] min-h-[620px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">

        {/* Panel Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">🤖 AI Citizen Assistant (Chat-Only)</h3>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Civic & Ward intelligence for Kopargaon residents</span>
            </div>
          </div>

          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/10 flex items-center flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            AI Assistant Active
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
          {messages.map(msg => {
            const isAI = msg.sender === 'ai';
            const isSpeakingThis = speakingMsgId === msg.id;
            return (
              <div key={msg.id} className={`flex items-start space-x-3.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
                {isAI && (
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-3xl space-y-1">
                  <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-xs border ${isAI
                      ? msg.error
                        ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 text-rose-700 dark:text-rose-400'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200'
                      : 'bg-emerald-600 border-emerald-600 text-white font-medium'
                    }`}>
                    {!isAI && <p>{msg.text}</p>}

                    {isAI && (
                      <div className="space-y-4">
                        <div className="prose dark:prose-invert text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                          {msg.text}
                        </div>

                        {/* Recommendations Highlights */}
                        {msg.data?.recommendations && msg.data.recommendations.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Civic Location Highlights</span>
                            {msg.data.recommendations.map((rec, idx) => (
                              <div key={idx} className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 flex justify-between items-center gap-3">
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{rec.name}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">{rec.reasons?.join(', ') || 'Verified Civic Location'}</span>
                                </div>
                                <Link
                                  to={`/citizen/gis?lat=${rec.latitude || rec.lat || ''}&lng=${rec.longitude || rec.lng || ''}&zoom=15&featureId=${encodeURIComponent(rec.name || '')}`}
                                  state={{ mapAction: { latitude: rec.latitude || rec.lat, longitude: rec.longitude || rec.lng, zoom: 15, featureId: rec.name, name: rec.name } }}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 flex-shrink-0 cursor-pointer shadow-xs"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>View on Map</span>
                                </Link>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Map Action Button */}
                        {msg.data?.mapAction && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                            <Link
                              to={`/citizen/gis?lat=${msg.data.mapAction.latitude || msg.data.mapAction.lat || ''}&lng=${msg.data.mapAction.longitude || msg.data.mapAction.lng || ''}&zoom=${msg.data.mapAction.zoom || 15}&featureId=${encodeURIComponent(msg.data.mapAction.featureId || msg.data.mapAction.projectId || msg.data.mapAction.name || '')}&featureType=${encodeURIComponent(msg.data.mapAction.featureType || msg.data.mapAction.type || '')}${msg.data.mapAction.candidates ? `&candidates=${encodeURIComponent(JSON.stringify(msg.data.mapAction.candidates))}` : ''}`}
                              state={{ mapAction: msg.data.mapAction }}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center space-x-2 transition-all shadow-md"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>View on Map</span>
                            </Link>

                            {msg.data.mapAction.featureId && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-mono">
                                ID: {msg.data.mapAction.featureId}
                              </span>
                            )}
                          </div>
                        )}

                        {msg.data?.sources && msg.data.sources.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2 text-[10px] text-slate-400">
                            <span>Sources:</span>
                            {msg.data.sources.map((s, i) => (
                              <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isAI && !msg.error && (
                    <div className="flex items-center space-x-2 px-1">
                      <button
                        onClick={() => isSpeakingThis ? stopSpeaking() : speakText(msg.text, msg.lang || language, msg.id)}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${isSpeakingThis
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isSpeakingThis ? '🔊 Speaking...' : '🔊 Listen'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold p-3 bg-emerald-500/10 rounded-xl w-fit">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>🤖 AI Citizen Assistant is processing your request...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Footer Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3 flex-shrink-0">
          {speakingMsgId && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-500/10 rounded-lg">
              <div className="flex items-center space-x-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>🔊 AI is speaking ({LANG_CONFIG[language]?.name})...</span>
              </div>
              <button onClick={stopSpeaking} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer">Stop</button>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Queries</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={isTyping}
                  className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer truncate max-w-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask AI Citizen Assistant (e.g. How do I track my complaint?)"
              disabled={isTyping}
              className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isTyping}
              className={`p-3 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${isListening
                  ? 'bg-rose-500 text-white animate-pulse border-rose-500'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              title="Voice Assistant"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CitizenAiAssistant;
