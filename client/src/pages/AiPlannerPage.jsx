import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, Mic, Navigation, Plus, AlertCircle, RefreshCw, Trash2, Send, Volume2, Globe, MapPin } from 'lucide-react';
import { aiPlannerService, ttsService } from '../services/api';
import toast from 'react-hot-toast';

// ─── Auto-detect language from text using script & word analysis ───
const detectLanguageFromText = (text) => {
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

// ─── Strip markdown formatting for cleaner TTS output ───
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

// ─── Language configuration ───
const LANG_CONFIG = {
  'en-IN': { label: 'EN', name: 'English' },
  'hi-IN': { label: 'हि', name: 'हिंदी' },
  'mr-IN': { label: 'मरा', name: 'मराठी' }
};

const AiPlannerPage = () => {
  // ─── State ───
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'नमस्कार! मी कोपरगाव स्मार्ट सिटी AI शहरी नियोजक आहे. तुम्ही मला मराठीत, हिंदीत किंवा इंग्रजीत प्रश्न विचारू शकता.\n\nHello! I am the Kopargaon Smart City AI Urban Planner. Ask me about hospital sites, infrastructure gaps, land zoning suitability, municipal budgets, or project updates.',
      data: null,
      lang: 'mr-IN'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-IN');
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [voices, setVoices] = useState([]);

  // Ref for auto-scrolling chat
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load voices for browser TTS
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    
    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {}
        audioRef.current = null;
      }
    };
  }, []);

  const unlockAudioEngine = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!window.__appAudioCtx) {
          window.__appAudioCtx = new AudioCtx();
        }
        if (window.__appAudioCtx.state === 'suspended') {
          window.__appAudioCtx.resume();
        }
      }

      if (!audioRef.current) {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silentAudio.volume = 0.01;
        silentAudio.play().then(() => {
          silentAudio.pause();
        }).catch(() => {});
        audioRef.current = silentAudio;
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}
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
          window.__activeUtterance = utterance;

          const isMarathi = targetLang === 'mr' || targetLang === 'mr-IN';
          const isHindi = targetLang === 'hi' || targetLang === 'hi-IN';
          const cleanLang = isMarathi ? 'mr-IN' : (isHindi ? 'hi-IN' : 'en-IN');
          
          utterance.lang = cleanLang;
          utterance.volume = 1;
          utterance.rate = 0.95;
          utterance.pitch = 1;

          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            let match = voices.find(v => v.lang === cleanLang || v.lang.replace('_', '-').toLowerCase() === cleanLang.toLowerCase());
            if (!match && isMarathi) match = voices.find(v => v.lang.toLowerCase().startsWith('mr'));
            if (!match && isMarathi) {
              match = voices.find(v => v.lang.toLowerCase().startsWith('hi')) || 
                      voices.find(v => v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('heera'));
            }
            if (!match) match = voices.find(v => v.lang.toLowerCase().startsWith('en-in') || v.name.toLowerCase().includes('india'));
            if (match) utterance.voice = match;
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
            if (isMarathi && e.error === 'language-unavailable') {
              try {
                const retryUtterance = new SpeechSynthesisUtterance(cleanText);
                retryUtterance.lang = 'hi-IN';
                window.__activeUtterance = retryUtterance;
                window.speechSynthesis.speak(retryUtterance);
              } catch (retryErr) {}
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
          setSpeakingMsgId(null);
        }
      }, 50);
    } catch (e) {
      setSpeakingMsgId(null);
    }
  };

  // ─── Text-to-Speech ───
  const speakText = async (text, langCode, msgId, directAudioUrl = null) => {
    stopSpeaking();
    const rawLang = langCode || language;
    const targetLang = (rawLang === 'mr' || rawLang === 'mr-IN')
      ? 'mr-IN'
      : ((rawLang === 'hi' || rawLang === 'hi-IN') ? 'hi-IN' : 'en-IN');

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

  const stopSpeaking = () => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) {}
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  // ─── Suggested Queries ───
  const suggestedQueries = [
    "Which projects need immediate attention?",
    "Why is the Ward 4 road project delayed?",
    "Where is the Ward 4 infrastructure project located?",
    "Show hospital recommendations in Ward 3.",
    "Analyze Ward 4 and identify its major infrastructure gaps."
  ];

  // ─── Send Query to AI ───
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
        language: queryLang,
        userType: 'administrator',
        userId: null,
        location: null,
        conversation: chatHistory
      };
      console.log("🚀 AI REQUEST:", requestPayload);

      const res = await aiPlannerService.queryAI(query, queryLang, 'administrator', requestPayload);
      console.log("🤖 AI RAW RESPONSE:", res);

      const answer = res.answer || res.text || res.response || res.message || res.output || 
                     (res.data && (res.data.answer || res.data.text || res.data.response || res.data.output));

      if (!answer || answer === 'Analysis completed.') {
        console.error("❌ NO VALID ANSWER RETURNED. FULL RESPONSE:", res);
        throw new Error("Invalid AI response format");
      }

      console.log("✅ AI ANSWER:", answer);

      const aiMsgId = Date.now() + 1;
      const aiMsg = {
        id: aiMsgId,
        sender: 'ai',
        text: answer,
        data: res,
        lang: queryLang
      };
      setMessages(prev => [...prev, aiMsg]);

      const directAudio = res?.audio || res?.data?.audio || null;
      speakText(aiMsg.text, queryLang, aiMsgId, directAudio).catch(err => {
        console.warn("Non-blocking TTS execution failed:", err);
      });
    } catch (err) {
      console.error(err);
      toast.error('AI Urban Planner service encountered an error.');
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: '⚠️ AI Urban Planner unavailable. Please try again.',
        error: true,
        lang: queryLang
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── Voice Input ───
  const handleVoiceInput = () => {
    unlockAudio();
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

      const preview = transcript.length > 50 ? transcript.substring(0, 50) + '...' : transcript;
      toast.success(`✅ "${preview}"`, { id: 'voice-toast' });

      // Pass the raw recognized text as-is to the existing AI query function
      setTimeout(() => handleSend(transcript, detectedLang), 300);
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
    toast.success('Conversation history cleared');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950 border border-slate-800 p-5 rounded-2xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>AI Urban Planner • Chat Assistant</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Kopargaon AI Urban Planner</h2>
          <p className="text-xs text-slate-300 mt-1">
            Data-backed civic growth recommendations, GIS insights & municipal analysis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 flex items-center space-x-1.5">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>Detected: {LANG_CONFIG[language]?.name || language}</span>
          </div>

          <button
            onClick={handleClearHistory}
            className="px-3.5 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center space-x-1.5 transition-all w-fit cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Workspace</span>
          </button>
        </div>
      </div>

      {/* Main Full-Width Chat Workspace */}
      <div className="flex flex-col h-[calc(100vh-250px)] min-h-[620px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white shadow">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">🤖 AI Urban Planner (Chat-Only)</h3>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 block">AI-powered decision support for Kopargaon urban planning</span>
            </div>
          </div>

          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/10 flex items-center flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            AI Assistant Active
          </span>
        </div>

        {/* Conversation history area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
          {messages.map(msg => {
            const isAI = msg.sender === 'ai';
            const isSpeakingThis = speakingMsgId === msg.id;
            return (
              <div key={msg.id} className={`flex items-start space-x-3.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
                {isAI && (
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-3xl space-y-1">
                  <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-xs border ${
                    isAI
                      ? msg.error
                        ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 text-rose-700 dark:text-rose-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      : 'bg-blue-600 border-blue-600 text-white font-medium'
                  }`}>
                    {!isAI && <p>{msg.text}</p>}

                    {isAI && (
                      <div className="space-y-4">
                        <div className="prose dark:prose-invert text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                          {msg.text}
                        </div>

                        {/* Structured Recommendations Site Rankings */}
                        {msg.data?.recommendations && msg.data.recommendations.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Recommended Location Highlights</span>

                            {msg.data.recommendations.map((rec, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-3"
                              >
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{rec.name}</span>
                                    {rec.score && <span className="font-extrabold text-blue-500 text-[10px]">({rec.score}/100)</span>}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">{rec.reasons?.join(', ') || 'Verified Site Location'}</span>
                                </div>

                                <Link
                                  to={`/gis?lat=${rec.latitude || rec.lat}&lng=${rec.longitude || rec.lng}&zoom=15&featureId=${encodeURIComponent(rec.name)}`}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1.5 flex-shrink-0 transition-all shadow-xs"
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
                              to={`/gis?lat=${msg.data.mapAction.latitude || ''}&lng=${msg.data.mapAction.longitude || ''}&zoom=${msg.data.mapAction.zoom || 15}&featureId=${encodeURIComponent(msg.data.mapAction.featureId || '')}&featureType=${encodeURIComponent(msg.data.mapAction.featureType || '')}`}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center space-x-2 transition-all shadow-md"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>View on Map</span>
                            </Link>

                            {msg.data.mapAction.featureId && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-mono">
                                Feature ID: {msg.data.mapAction.featureId}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Sources list footer */}
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

                  {/* Voice playback button */}
                  {isAI && !msg.error && (
                    <div className="flex items-center space-x-2 px-1">
                      <button
                        onClick={() => isSpeakingThis ? stopSpeaking() : speakText(msg.text, msg.lang || language, msg.id)}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isSpeakingThis
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse'
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
            <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 font-bold p-3 bg-blue-500/10 rounded-xl w-fit">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>🤖 AI Urban Planner is processing query & fetching city insights...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input & Prompts Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3 flex-shrink-0">
          
          {speakingMsgId && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-blue-500/10 rounded-lg">
              <div className="flex items-center space-x-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>🔊 Speaking AI Response...</span>
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
                  className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors truncate max-w-xs cursor-pointer"
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
              placeholder="Ask AI Urban Planner (e.g. Where is Ward 4 infrastructure project?)"
              disabled={isTyping}
              className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-400"
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isTyping}
              className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse border-rose-500'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
              }`}
              title={`Voice Input (${LANG_CONFIG[language]?.name})`}
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiPlannerPage;
