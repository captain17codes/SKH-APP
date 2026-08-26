import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../gis/MapView';
import { Bot, Sparkles, Mic, Navigation, AlertCircle, RefreshCw, Trash2, Send, Volume2, Globe, FileText, CheckCircle, MapPin } from 'lucide-react';
import { aiPlannerService, ttsService } from '../../services/api';
import { KOPARGAON_CENTER } from '../../data/mockData';
import toast from 'react-hot-toast';

// Auto-detect language from text
const detectLanguageFromText = (text) => {
  if (!text || !text.trim()) return 'en-IN';
  
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const lowerText = text.toLowerCase();

  if (devanagariCount > 0) {
    const marathiWords = ['मला', 'मराठी', 'कोपरगाव', 'रुग्णालय', 'दवाखाना', 'रस्ता', 'रस्ते', 'पाणी', 'शाळा', 'प्रकल्प', 'तक्रार', 'सुविधा', 'नगरपालिका', 'कुठे', 'किती', 'आहे', 'माझ्या', 'कोणते'];
    const hindiWords = ['मुझे', 'हिंदी', 'कोपरगांव', 'अस्पताल', 'सड़क', 'पानी', 'स्कूल', 'परियोजना', 'शिकायत', 'सुविधा', 'नगरपालिका', 'कहाँ', 'कितना', 'है', 'बताओ', 'खोजो', 'काम'];
    
    let marathiScore = 0;
    let hindiScore = 0;
    marathiWords.forEach(word => { if (text.includes(word)) marathiScore++; });
    hindiWords.forEach(word => { if (text.includes(word)) hindiScore++; });
    
    if (marathiScore > hindiScore) return 'mr-IN';
    if (hindiScore > marathiScore) return 'hi-IN';
    if (text.includes('ळ') || text.includes('चा') || text.includes('ची') || text.includes('चे') || text.includes('ून')) return 'mr-IN';
    return 'mr-IN';
  }

  const marathiTrans = ['mala', 'marathi', 'kopargaon', 'pani', 'rasta', 'prakalpa', 'takrar', 'ahe', 'sang'];
  const hindiTrans = ['mujhe', 'chahiye', 'kahan', 'batao', 'dikhao', 'paani', 'sadak', 'shikayat', 'hai'];
  
  let mTransScore = 0;
  let hTransScore = 0;
  marathiTrans.forEach(w => { if (new RegExp('\\b' + w + '\\b', 'i').test(lowerText)) mTransScore++; });
  hindiTrans.forEach(w => { if (new RegExp('\\b' + w + '\\b', 'i').test(lowerText)) hTransScore++; });
  
  if (mTransScore > hTransScore) return 'mr-IN';
  if (hTransScore > mTransScore) return 'hi-IN';
  return 'en-IN';
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
      lang: 'mr-IN'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('mr-IN');
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [candidateLocations, setCandidateLocations] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);

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
      try { audioRef.current.pause(); } catch (e) {}
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  const unlockAudio = () => {
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
    } catch (e) {}
  };

  const fallbackBrowserTTS = (text, targetLang, msgId) => {
    if ('speechSynthesis' in window) {
      const cleanText = stripMarkdownForTTS(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = targetLang;
      utterance.volume = 1;
      utterance.rate = 1;
      utterance.onstart = () => setSpeakingMsgId(msgId || null);
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setSpeakingMsgId(null);
    }
  };

  const speakText = async (text, langCode, msgId, directAudioUrl = null) => {
    stopSpeaking();
    const targetLang = langCode || language;
    try {
      let audioUrl = directAudioUrl;
      let needsRevoke = false;

      if (!audioUrl) {
        audioUrl = await ttsService.speak(text, targetLang);
        needsRevoke = true;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setSpeakingMsgId(msgId || null);
      audio.onended = () => {
        setSpeakingMsgId(null);
        if (needsRevoke) URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };
      audio.onerror = () => {
        setSpeakingMsgId(null);
        if (needsRevoke) URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
        fallbackBrowserTTS(text, targetLang, msgId);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Auto-play error or blocked, using browser speech fallback:", error);
          if (audioRef.current === audio) audioRef.current = null;
          fallbackBrowserTTS(text, targetLang, msgId);
        });
      }
    } catch (err) {
      console.warn("TTS Service error, falling back to browser TTS:", err);
      fallbackBrowserTTS(text, targetLang, msgId);
    }
  };

  const suggestedQueries = [
    "मेरी शिकायत का स्टेटस क्या है?",
    "मेरे वार्ड में कौनसे विकास कार्य चल रहे हैं?",
    "Show projects near me.",
    "माझ्या परिसरात कोणते प्रकल्प सुरू आहेत?",
    "Water supply schedule in Ward 4",
    "Report road repair near Station Road"
  ];

  const handleSend = async (queryText, overrideLang) => {
    unlockAudio();
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
      const res = await aiPlannerService.queryAI(query, queryLang, 'citizen');

      const aiMsgId = Date.now() + 1;
      const aiMsg = {
        id: aiMsgId,
        sender: 'ai',
        text: res.answer || res.text || 'Analysis completed.',
        data: res,
        lang: queryLang
      };
      setMessages(prev => [...prev, aiMsg]);

      const directAudio = res?.audio || res?.data?.audio || null;
      speakText(aiMsg.text, queryLang, aiMsgId, directAudio);

      if (res.mapAction && res.mapAction.type === 'SHOW_CANDIDATES' && res.recommendations) {
        const list = res.recommendations.map(c => ({
          id: `candidate-${c.rank || 1}`,
          rank: c.rank || 1,
          score: c.score || 90,
          lat: c.latitude || c.lat || 19.883,
          lng: c.longitude || c.lng || 74.488,
          name: c.name || `Civic Site #${c.rank || 1}`,
          reasons: c.reasons || []
        }));
        setCandidateLocations(list);
        if (list.length > 0) {
          setMapCenter([list[0].lat, list[0].lng]);
          setMapZoom(15);
        }
      } else if (res.mapAction && res.mapAction.latitude) {
        setMapCenter([res.mapAction.latitude, res.mapAction.longitude]);
        setMapZoom(res.mapAction.zoom || 15);
      }
    } catch (err) {
      console.error(err);
      toast.error('AI Citizen Assistant is temporarily unavailable.');
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: '⚠️ AI Assistant is temporarily unavailable. Please try again in a few moments or submit a manual complaint.',
        error: true,
        lang: queryLang
      }]);
    } finally {
      setIsTyping(false);
    }
  };

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
    recognition.lang = language;
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

      const detectedLang = detectLanguageFromText(transcript);
      setLanguage(detectedLang);
      setInput(transcript);

      toast.success(`✅ "${transcript}"`, { id: 'voice-toast' });
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
    setCandidateLocations([]);
    setSelectedFeature(null);
    setMapCenter(KOPARGAON_CENTER);
    setMapZoom(14);
    toast.success('Conversation history reset');
  };

  const flyToCoords = (lat, lng, zoom = 16) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoom);
    toast.success('Map panned to target location.');
  };

  return (
    <div className="space-y-6">
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
            Real-time civic intelligence, complaint updates, water & road project status powered by PostgreSQL/PostGIS spatial data.
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

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-270px)] min-h-[620px]">
        {/* Left Side: Assistant Panel */}
        <div className="lg:col-span-6 flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">🤖 AI Citizen Assistant Panel</h3>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Civic & Ward intelligence for Kopargaon residents</span>
              </div>
            </div>

            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 flex items-center flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              Grok 4.5 Active
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
            {messages.map(msg => {
              const isAI = msg.sender === 'ai';
              const isSpeakingThis = speakingMsgId === msg.id;
              return (
                <div key={msg.id} className={`flex items-start space-x-3.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
                  {isAI && (
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-1">
                    <div className={`rounded-2xl p-4 text-[11px] leading-relaxed shadow-xs border ${
                      isAI
                        ? msg.error
                          ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 text-rose-700 dark:text-rose-400'
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200'
                        : 'bg-emerald-600 border-emerald-600 text-white font-medium'
                    }`}>
                      {!isAI && <p>{msg.text}</p>}

                      {isAI && (
                        <div className="space-y-4">
                          <div className="prose dark:prose-invert text-[11px] leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                            {msg.text}
                          </div>

                          {msg.data?.recommendations && msg.data.recommendations.length > 0 && (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Civic Location Highlights</span>
                              {msg.data.recommendations.map((rec, idx) => (
                                <div key={idx} className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 flex justify-between items-center">
                                  <div>
                                    <div className="flex items-center space-x-1.5">
                                      <MapPin className="w-3 h-3 text-emerald-500" />
                                      <span className="font-bold text-slate-900 dark:text-slate-100">{rec.name}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 block mt-0.5">{rec.reasons?.join(', ') || 'Verified Civic Point'}</span>
                                  </div>
                                  <button
                                    onClick={() => flyToCoords(rec.latitude, rec.longitude)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Navigation className="w-2.5 h-2.5" />
                                    <span>View on Map</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {msg.data?.sources && msg.data.sources.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2 text-[9px] text-slate-400">
                              <span>Sources:</span>
                              {msg.data.sources.map((s, i) => (
                                <span key={i} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{s}</span>
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
                          className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                            isSpeakingThis
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-pulse'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{isSpeakingThis ? '🔊 Speaking...' : '🔊 Listen'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center space-x-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold p-3 bg-emerald-500/10 rounded-xl w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
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
                <button onClick={stopSpeaking} className="text-[9px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer">Stop</button>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Queries</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    disabled={isTyping}
                    className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer truncate max-w-[220px]"
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
                className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />

              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={isTyping}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  isListening
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
                className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="lg:col-span-6 h-[400px] lg:h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-950 relative">
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

export default CitizenAiAssistant;
