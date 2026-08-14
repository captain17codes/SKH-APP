 import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../components/gis/MapView';
import { Bot, Sparkles, Mic, Navigation, Plus, AlertCircle, RefreshCw, Trash2, Send, Volume2, Globe } from 'lucide-react';
import { aiPlannerService, ttsService } from '../services/api';
import { KOPARGAON_CENTER } from '../data/mockData';
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
      text: 'नमस्कार! मी कोपरगाव स्मार्ट सिटी AI शहरी नियोजक आहे. तुम्ही मला मराठीत, हिंदीत किंवा इंग्रजीत प्रश्न विचारू शकता.\n\nHello! I am the Kopargaon Smart City AI Urban Planner. Ask me to find optimal hospital locations, analyze infrastructure gaps, or evaluate land zoning suitability.',
      data: null,
      lang: 'mr-IN'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-IN'); // Default: English
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  // Ref for auto-scrolling chat
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {
          // ignore
        }
        audioRef.current = null;
      }
    };
  }, []);

  // ─── Text-to-Speech (Google Cloud TTS Integration with Browser Fallback) ───
  const speakText = async (text, langCode, msgId) => {
    // Stop any existing speech before starting new one
    stopSpeaking();

    const targetLang = langCode || language;
    try {
      // Call backend Google TTS service to synthesize speech and get local object URL
      const audioUrl = await ttsService.speak(text, targetLang);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setSpeakingMsgId(msgId || null);
      };

      audio.onended = () => {
        setSpeakingMsgId(null);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      audio.onerror = (e) => {
        console.error("HTML5 Audio playback error:", e);
        setSpeakingMsgId(null);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      await audio.play();
    } catch (err) {
      console.error("Failed to generate/play Google Cloud TTS voice, falling back to browser TTS:", err);
      
      if ('speechSynthesis' in window) {
        toast.success("Using browser's built-in voice as fallback.", { id: 'voice-fallback' });
        const cleanText = stripMarkdownForTTS(text);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = targetLang;
        
        utterance.onstart = () => setSpeakingMsgId(msgId || null);
        utterance.onend = () => setSpeakingMsgId(null);
        utterance.onerror = () => {
           setSpeakingMsgId(null);
           toast.error("AI response generated, but voice output is temporarily unavailable.");
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        toast.error("AI response generated, but voice output is temporarily unavailable.");
        setSpeakingMsgId(null);
      }
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {
        console.warn("Error pausing audio:", e);
      }
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  // ─── GIS Map State (existing) ───
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [candidateLocations, setCandidateLocations] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // ─── Suggested Queries (existing) ───
  const suggestedQueries = [
    "Which projects need immediate attention?",
    "Why is the Ward 4 road project delayed?",
    "Which projects have high budget utilization?",
    "Show delayed projects.",
    "Analyze project PRJ-2026-002",
    "Where should a new hospital be built in Ward 4?",
    "Analyze Ward 4 and identify its major infrastructure gaps."
  ];

  // ─── Send Query to AI (existing flow + language support) ───
  const handleSend = async (queryText, overrideLang) => {
    const query = queryText || input;
    if (!query.trim()) return;

    // Auto-detect language from query text
    const queryLang = overrideLang || detectLanguageFromText(query);
    setLanguage(queryLang);

    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsTyping(true);

    // Cancel any ongoing speech before new query
    stopSpeaking();

    try {
      // Pass language to the existing AI Urban Planner API
      const res = await aiPlannerService.queryAI(query, queryLang);

      const aiMsgId = Date.now() + 1;
      const aiMsg = {
        id: aiMsgId,
        sender: 'ai',
        text: res.answer || res.text || 'Analysis completed.',
        data: res,
        lang: queryLang
      };
      setMessages(prev => [...prev, aiMsg]);

      // Auto-speak the AI response aloud
      speakText(aiMsg.text, queryLang, aiMsgId);

      // ── Apply Map Action (existing functionality preserved) ──
      if (res.mapAction && res.mapAction.type === 'SHOW_CANDIDATES' && res.recommendations) {
        const list = res.recommendations.map(c => ({
          id: `candidate-${c.rank}`,
          rank: c.rank,
          score: c.score,
          lat: c.latitude || c.lat,
          lng: c.longitude || c.lng,
          name: c.name || `Candidate Plot #${c.rank}`,
          reasons: c.reasons || [],
          zoning: c.zoning || 'Government',
          area: c.area || 8.5
        }));
        setCandidateLocations(list);
        if (list.length > 0) {
          setMapCenter([list[0].lat, list[0].lng]);
          setMapZoom(15);
        }
        toast.success(`Analysis returned ${list.length} candidate sites. Green markers placed on the map.`);
      } else if (res.mapAction && res.mapAction.latitude) {
        setMapCenter([res.mapAction.latitude, res.mapAction.longitude]);
        setMapZoom(res.mapAction.zoom || 15);
      }
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

  // ─── Voice Input (natural conversation — auto-send after recognition) ───
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech before listening
    stopSpeaking();

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = language; // Use current language state (default mr-IN)
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      const langName = LANG_CONFIG[language]?.name || language;
      toast.loading(`🎤 ऐकत आहे... (${langName})`, { id: 'voice-toast' });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (!transcript.trim()) {
        toast.error('No speech detected.', { id: 'voice-toast' });
        return;
      }

      // Auto-detect language from recognized text
      const detectedLang = detectLanguageFromText(transcript);
      setLanguage(detectedLang);
      setInput(transcript);

      const preview = transcript.length > 50 ? transcript.substring(0, 50) + '...' : transcript;
      toast.success(`✅ "${preview}"`, { id: 'voice-toast' });

      // Auto-send the recognized speech to AI Urban Planner
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

  // ─── Clear History (existing) ───
  const handleClearHistory = () => {
    stopSpeaking();
    setMessages([messages[0]]);
    setCandidateLocations([]);
    setSelectedFeature(null);
    setMapCenter(KOPARGAON_CENTER);
    setMapZoom(14);
    toast.success('Conversation history cleared');
  };



  // ─── Fly to coordinates (existing) ───
  const flyToCoords = (lat, lng, zoom = 16) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoom);
    toast.success('Camera panned to target coordinate site.');
  };

  // ─── JSX ───
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950 border border-slate-800 p-5 rounded-2xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Generative spatial planning platform</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Kopargaon AI Urban Planner</h2>
          <p className="text-xs text-slate-300 mt-1">
            Data-backed civic growth recommendations driven by PostgreSQL/PostGIS databases and Model Context Protocol spatial microservices.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language indicator */}
          <div className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 flex items-center space-x-1.5">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>Detected: {LANG_CONFIG[language]?.name || language}</span>
          </div>

          <button
            onClick={handleClearHistory}
            className="px-3.5 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center space-x-1.5 transition-all w-fit cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset workspace</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Grid (Desktop side-by-side, mobile stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-270px)] min-h-[620px]">
        {/* Left Side: Planner Dashboard panel */}
        <div className="lg:col-span-5 flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">

          {/* Panel Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white shadow">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">🤖 AI Urban Planner Panel</h3>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">AI-powered decision support for Kopargaon urban planning</span>
              </div>
            </div>

            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 flex items-center flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              Grok 4.5 Active
            </span>
          </div>

          {/* Conversation history area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
            {messages.map(msg => {
              const isAI = msg.sender === 'ai';
              const isSpeakingThis = speakingMsgId === msg.id;
              return (
                <div key={msg.id} className={`flex items-start space-x-3.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
                  {isAI && (
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-1">
                    <div className={`rounded-2xl p-4 text-[11px] leading-relaxed shadow-xs border ${
                      isAI
                        ? msg.error
                          ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 text-rose-700 dark:text-rose-400'
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200'
                        : 'bg-blue-600 border-blue-600 text-white font-medium'
                    }`}>
                      {/* Render raw prompt text */}
                      {!isAI && <p>{msg.text}</p>}

                      {/* Render Structured Result Layout */}
                      {isAI && (
                        <div className="space-y-4">
                          {/* Text explanation block */}
                          <div className="prose dark:prose-invert text-[11px] leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                            {msg.text}
                          </div>

                          {/* Suitability Candidate Highlights list */}
                          {msg.data?.recommendations && msg.data.recommendations.length > 0 && (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Suitability Site Rankings</span>

                              {msg.data.recommendations.map((rec) => {
                                const isTop = rec.rank === 1;
                                return (
                                  <div
                                    key={rec.rank}
                                    className={`p-3 rounded-xl border transition-all ${
                                      isTop
                                        ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/5'
                                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/50'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <div className="flex items-center space-x-1.5">
                                          {isTop && (
                                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                              ⭐ Recommended
                                            </span>
                                          )}
                                          <span className="font-bold text-slate-900 dark:text-slate-100">{rec.name}</span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 block mt-0.5">Rank #{rec.rank} Alternative candidate</span>
                                      </div>
                                      <span className="font-extrabold text-blue-500 flex-shrink-0 text-xs">{rec.score}/100</span>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      <button
                                        onClick={() => flyToCoords(rec.latitude, rec.longitude)}
                                        className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold flex items-center space-x-1"
                                      >
                                        <Navigation className="w-2.5 h-2.5" />
                                        <span>View on Map</span>
                                      </button>

                                      <Link
                                        to={`/projects?create=true&cat=Healthcare&lat=${rec.latitude}&lng=${rec.longitude}`}
                                        className="px-2 py-0.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold rounded flex items-center space-x-1 text-slate-600 dark:text-slate-400"
                                      >
                                        <Plus className="w-2.5 h-2.5" />
                                        <span>Register Project</span>
                                      </Link>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Insufficient data handling */}
                          {msg.data && msg.data.success === false && (
                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-2">
                              <AlertCircle className="w-6 h-6 text-slate-400" />
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">📊 Insufficient GIS Data</h4>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                "We don't have enough verified GIS data to generate a reliable recommendation."
                              </p>
                            </div>
                          )}

                          {/* Sources list footer */}
                          {msg.data?.sources && msg.data.sources.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2 text-[9px] text-slate-400 dark:text-slate-500">
                              <span>Sources:</span>
                              {msg.data.sources.map((s, i) => (
                                <span key={i} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 🔊 Speaker / Replay button for AI messages */}
                    {isAI && !msg.error && (
                      <div className="flex items-center space-x-2 px-1">
                        <button
                          onClick={() => isSpeakingThis ? stopSpeaking() : speakText(msg.text, msg.lang || language, msg.id)}
                          className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                            isSpeakingThis
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          title={isSpeakingThis ? 'Stop speaking' : 'Listen to response'}
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{isSpeakingThis ? '🔊 Speaking...' : '🔊 Listen'}</span>
                        </button>
                        {msg.lang && (
                          <span className="text-[8px] text-slate-400 dark:text-slate-600">
                            {LANG_CONFIG[msg.lang]?.name || msg.lang}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center space-x-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold p-3 bg-blue-500/10 rounded-xl w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>🤖 AI Urban Planner is analyzing Kopargaon GIS data...</span>
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={chatEndRef} />
          </div>

          {/* Selected Candidate details overlay block inside planner */}
          {selectedFeature && selectedFeature.type === 'candidate' && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 border-l-4 border-l-emerald-500 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Rank #{selectedFeature.feat.rank} Candidate Specs</span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">{selectedFeature.feat.name}</h4>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕ Close
                </button>
              </div>

              <div className="mt-2 text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
                <p>Zoning: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedFeature.feat.zoning} ({selectedFeature.feat.area} Acres)</span></p>
                <p>Suitability Score: <span className="font-bold text-emerald-500">{selectedFeature.feat.score}/100</span></p>
                {selectedFeature.feat.reasons && (
                  <div className="mt-1 space-y-0.5">
                    {selectedFeature.feat.reasons.map((r, i) => (
                      <p key={i} className="flex items-start text-slate-500">
                        <span className="text-emerald-500 mr-1">✓</span> {r}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input & prompts Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3 flex-shrink-0">

            {/* Speaking indicator */}
            {speakingMsgId && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-blue-500/10 rounded-lg">
                <div className="flex items-center space-x-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  <span>🔊 AI is speaking ({LANG_CONFIG[language]?.name})...</span>
                </div>
                <button onClick={stopSpeaking} className="text-[9px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer">Stop</button>
              </div>
            )}

            {/* Suggested prompts checklist */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Queries</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    disabled={isTyping}
                    className="text-[10px] px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors w-fit truncate max-w-[200px] cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat query form */}
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
                placeholder="Ask AI Urban Planner (e.g., Where should a new hospital be built in Ward 4?)"
                disabled={isTyping}
                className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-400"
              />



              {/* Microphone button */}
              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={isTyping}
                className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse border-rose-500'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title={`Voice Input (${LANG_CONFIG[language]?.name})`}
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="lg:col-span-7 h-[400px] lg:h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-950 relative">
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            candidateLocations={candidateLocations}
            onSelectFeature={(feat, type) => {
              setSelectedFeature({ feat, type });
              if (feat.lat && feat.lng) {
                setMapCenter([feat.lat, feat.lng]);
                setMapZoom(16);
              }
            }}
            selectedFeature={selectedFeature}
            showAllControls={true}
            height="h-full"
            onZoomChange={setMapZoom}
            onCenterChange={setMapCenter}
          />
        </div>
      </div>
    </div>
  );
};

export default AiPlannerPage;
