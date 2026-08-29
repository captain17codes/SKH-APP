import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, Mic, RefreshCw, Trash2, Send, Volume2, Globe, MapPin } from 'lucide-react';
import { aiPlannerService, ttsService } from '../../services/api';
import toast from 'react-hot-toast';

// Auto-detect language from text
const detectLanguageFromText = (text) => {
  if (!text || !text.trim()) return 'en-IN';
  
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const lowerText = text.toLowerCase();

  if (devanagariCount > 0) {
    const marathiWords = ['मला', 'मराठी', 'कोपरगाव', 'व्यवसाय', 'जमीन', 'दुकान', 'प्लॉट', 'रस्ता', 'पाणी', 'प्रकल्प', 'योग्य', 'नगरपालिका', 'कुठे', 'किती', 'आहे', 'माझ्यासाठी', 'कोणती'];
    const hindiWords = ['मुझे', 'हिंदी', 'कोपरगांव', 'व्यापार', 'जमीन', 'दुकान', 'प्लॉट', 'सड़क', 'परियोजना', 'सुविधा', 'नगरपालिका', 'कहाँ', 'कितना', 'है', 'बताओ', 'व्यावसायिक', 'दिखाओ'];
    
    let marathiScore = 0;
    let hindiScore = 0;
    marathiWords.forEach(word => { if (text.includes(word)) marathiScore++; });
    hindiWords.forEach(word => { if (text.includes(word)) hindiScore++; });
    
    if (marathiScore > hindiScore) return 'mr-IN';
    if (hindiScore > marathiScore) return 'hi-IN';
    if (text.includes('ळ') || text.includes('चा') || text.includes('ची') || text.includes('चे') || text.includes('ून')) return 'mr-IN';
    return 'mr-IN';
  }

  const marathiTrans = ['mala', 'marathi', 'kopargaon', 'vyavasay', 'jamin', 'plot', 'ahe', 'sang', 'yogya'];
  const hindiTrans = ['mujhe', 'chahiye', 'kahan', 'batao', 'dikhao', 'zameen', 'business', 'hai'];
  
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

const BusinessAiAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'नमस्कार! मी कोपरगाव स्मार्ट सिटी AI व्यावसायिक गुंतवणूक सल्लागार आहे. मला व्यावसायिक जमीन, मोकळे प्लॉट, गोदाम किंवा दुकानांसाठी योग्य ठिकाणांबद्दल विचारा.\n\nHello! I am your Kopargaon Smart City AI Business Assistant. Ask me about commercial land availability, warehouses, shops, road connectivity, or investment suitability.',
      data: null,
      lang: 'mr-IN'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-IN');
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

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

          const femaleKeywords = ['female', 'zira', 'heera', 'jenny', 'samantha', 'veena', 'kalpana', 'hazel', 'aria', 'natasha', 'victoria', 'karen', 'google us english', 'google uk english female', 'microsoft zira'];
          const maleKeywords = ['male', 'ravi', 'david', 'mark', 'george', 'james', 'richard'];

          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            let match = voices.find(v => {
              const langMatch = (v.lang === cleanLang || v.lang.replace('_', '-').toLowerCase() === cleanLang.toLowerCase());
              const nameLower = v.name.toLowerCase();
              const isFemale = femaleKeywords.some(kw => nameLower.includes(kw));
              const isMale = maleKeywords.some(kw => nameLower.includes(kw));
              return langMatch && (isFemale || !isMale);
            });

            if (!match && isMarathi) {
              match = voices.find(v => v.lang.toLowerCase().startsWith('mr') || v.lang.toLowerCase().startsWith('hi'));
            }

            if (!match) {
              match = voices.find(v => {
                const nameLower = v.name.toLowerCase();
                return femaleKeywords.some(kw => nameLower.includes(kw)) && !maleKeywords.some(kw => nameLower.includes(kw));
              });
            }

            if (!match) {
              match = voices.find(v => !maleKeywords.some(kw => v.name.toLowerCase().includes(kw)));
            }

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

  const suggestedQueries = [
    "Where should commercial development be encouraged?",
    "Which ward has the highest population?",
    "What is the solar potential of Kopargaon?",
    "Where is mixed-use development suitable?",
    "How many smart city projects are active?"
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

    try {
      const res = await aiPlannerService.queryAI(query, queryLang, 'business');

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
    } catch (err) {
      console.error(err);
      toast.error('AI Business Assistant is temporarily unavailable.');
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: '⚠️ AI Assistant is temporarily unavailable. Please try again.',
        error: true,
        lang: queryLang
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = () => {
    unlockAudioEngine();

    // Stop listening if mic button clicked while already listening
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      toast.dismiss('voice-toast');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.', { id: 'voice-toast' });
      return;
    }

    stopSpeaking();

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;

      let sttLang = 'en-IN';
      if (language === 'mr' || language === 'mr-IN') {
        sttLang = 'mr-IN';
      } else if (language === 'hi' || language === 'hi-IN') {
        sttLang = 'hi-IN';
      }

      recognition.lang = sttLang;

      recognition.onstart = () => {
        setIsListening(true);
        const displayLang = sttLang === 'mr-IN' ? 'मराठी' : (sttLang === 'hi-IN' ? 'हिंदी' : 'English');
        toast.loading(`🎤 Listening... (${displayLang})`, { id: 'voice-toast' });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (!transcript || !transcript.trim()) {
          toast.error("Sorry, I couldn't hear that. Please try again.", { id: 'voice-toast' });
          return;
        }

        const detectedLang = detectLanguageFromText(transcript);
        console.log(`🎤 [STT TRANSCRIPT]: "${transcript}" | Detected Language: ${detectedLang}`);
        setLanguage(detectedLang);
        setInput(transcript);

        toast.success(`✅ Speech captured! Review text in input box and click Send.`, { id: 'voice-toast', duration: 4000 });
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          toast.error('Microphone permission is required for voice input.', { id: 'voice-toast' });
        } else if (event.error === 'no-speech') {
          toast.error("Sorry, I couldn't hear that. Please try again.", { id: 'voice-toast' });
        } else if (event.error === 'audio-capture') {
          toast.error('No microphone was found on your device.', { id: 'voice-toast' });
        } else {
          toast.error(`Voice input error: ${event.error}`, { id: 'voice-toast' });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      toast.error(`Failed to access microphone: ${err.message}`, { id: 'voice-toast' });
    }
  };

  const handleClearHistory = () => {
    stopSpeaking();
    setMessages([messages[0]]);
    toast.success('Conversation history reset');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-slate-800 p-5 rounded-2xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Business & Commercial AI Advisory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-400" />
            <span>AI Business Assistant</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Commercial land intelligence, zoning analysis, footfall & investment suitability.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 flex items-center space-x-1.5">
            <Globe className="w-3 h-3 text-blue-400" />
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
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white shadow">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">🤖 AI Business Assistant (Chat-Only)</h3>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Commercial & Industrial Investment Advisory for Kopargaon</span>
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
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-3xl space-y-1">
                  <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-xs border ${
                    isAI
                      ? msg.error
                        ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 text-rose-700 dark:text-rose-400'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200'
                      : 'bg-blue-600 border-blue-600 text-white font-medium'
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
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commercial Location Highlights</span>
                            {msg.data.recommendations.map((rec, idx) => (
                              <div key={idx} className="p-3 rounded-xl border bg-blue-500/10 border-blue-500/30 flex justify-between items-center gap-3">
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{rec.name}</span>
                                    {rec.score && <span className="font-extrabold text-blue-500 text-[10px]">({rec.score}/100)</span>}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">{rec.reasons?.join(', ') || 'Verified Plot Location'}</span>
                                </div>
                                <Link
                                  to={`/business/gis?lat=${rec.latitude || rec.lat || ''}&lng=${rec.longitude || rec.lng || ''}&zoom=15&featureId=${encodeURIComponent(rec.name || '')}`}
                                  state={{ mapAction: { latitude: rec.latitude || rec.lat, longitude: rec.longitude || rec.lng, zoom: 15, featureId: rec.name, name: rec.name } }}
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 flex-shrink-0 cursor-pointer shadow-xs"
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
                              to={`/business/gis?lat=${msg.data.mapAction.latitude || msg.data.mapAction.lat || ''}&lng=${msg.data.mapAction.longitude || msg.data.mapAction.lng || ''}&zoom=${msg.data.mapAction.zoom || 15}&featureId=${encodeURIComponent(msg.data.mapAction.featureId || msg.data.mapAction.projectId || '')}&featureType=${encodeURIComponent(msg.data.mapAction.featureType || '')}`}
                              state={{ mapAction: msg.data.mapAction }}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center space-x-2 transition-all shadow-md"
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
              <span>🤖 AI Business Assistant is processing commercial GIS data...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Footer Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3 flex-shrink-0">
          {speakingMsgId && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-blue-500/10 rounded-lg">
              <div className="flex items-center space-x-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
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
                  className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer truncate max-w-xs"
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
              placeholder="Ask AI Business Assistant (e.g. Find commercial plot in Ward 4)"
              disabled={isTyping}
              className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isTyping}
              className={`p-3 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
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

export default BusinessAiAssistant;
