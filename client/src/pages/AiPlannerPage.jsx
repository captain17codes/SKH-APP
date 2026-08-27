import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
    return 'mr-IN';
  }

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

const AiPlannerPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello Administrator. I am ready to assist with urban planning analysis for Kopargaon. How can I help you today?',
      data: null,
      lang: 'en-IN'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-IN');
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [voices, setVoices] = useState([]);

  const chatEndRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
            setSpeakingMsgId(msgId || null);
          };
          utterance.onend = () => {
            setSpeakingMsgId(null);
            window.__activeUtterance = null;
          };
          utterance.onerror = (e) => {
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
        setSpeakingMsgId(msgId || null);
      };
      
      audio.onended = () => {
        setSpeakingMsgId(null);
        if (needsRevoke) URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setSpeakingMsgId(null);
        if (needsRevoke) URL.revokeObjectURL(audioUrl);
        fallbackBrowserTTS(text, targetLang, msgId);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
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

  const suggestedQueries = [
    "Generate traffic impact report for Site A",
    "Check water supply capacity for Ward 3",
    "Estimate land acquisition cost for Site B"
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

      const res = await aiPlannerService.queryAI(query, queryLang, 'administrator', requestPayload);

      const answer = res.answer || res.text || res.response || res.message || res.output || 
                     (res.data && (res.data.answer || res.data.text || res.data.response || res.data.output));

      if (!answer || answer === 'Analysis completed.') {
        throw new Error("Invalid AI response format");
      }

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
      toast.loading(`Listening... (${displayLang})`, { id: 'voice-toast' });
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

      const preview = transcript.length > 50 ? transcript.substring(0, 50) + '...' : transcript;
      toast.success(`"${preview}"`, { id: 'voice-toast' });

      setTimeout(() => handleSend(transcript, detectedLang), 300);
    };

    recognition.onerror = (event) => {
      toast.error(`Speech recognition failed: ${event.error}`, { id: 'voice-toast' });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex-1 flex h-full min-w-0 bg-background overflow-hidden relative rounded-xl border border-outline-variant dark:border-outline">
      {/* Chat History Panel (Left) */}
      <section className="w-72 border-r border-outline-variant dark:border-outline bg-surface-bright dark:bg-surface-variant flex flex-col shrink-0 z-30 hidden lg:flex">
        <div className="p-4 border-b border-outline-variant dark:border-outline flex justify-between items-center">
          <h2 className="text-title-lg font-title-lg text-on-surface dark:text-inverse-on-surface">Recent Planning</h2>
          <button className="p-2 rounded-full hover:bg-surface-container-low text-primary dark:text-primary-fixed transition-colors cursor-pointer">
            <span className="material-symbols-outlined">edit_square</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {/* Active Chat Session */}
          <button className="w-full text-left p-3 rounded-lg bg-primary-container/10 border border-primary/20 flex flex-col gap-1 transition-colors cursor-pointer">
            <span className="text-label-md font-label-md text-primary dark:text-primary-fixed">New Hospital Site Analysis</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant dark:text-inverse-on-surface">Today, 10:42 AM</span>
          </button>
          <button className="w-full text-left p-3 rounded-lg hover:bg-surface-container-low border border-transparent flex flex-col gap-1 transition-colors cursor-pointer">
            <span className="text-label-md font-label-md text-on-surface dark:text-inverse-on-surface">Ward 4 Traffic Flow</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant dark:text-inverse-on-surface">Yesterday, 3:15 PM</span>
          </button>
          <button className="w-full text-left p-3 rounded-lg hover:bg-surface-container-low border border-transparent flex flex-col gap-1 transition-colors cursor-pointer">
            <span className="text-label-md font-label-md text-on-surface dark:text-inverse-on-surface">Water Pipe Network Upgrade</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant dark:text-inverse-on-surface">Oct 12, 2023</span>
          </button>
          <button className="w-full text-left p-3 rounded-lg hover:bg-surface-container-low border border-transparent flex flex-col gap-1 transition-colors cursor-pointer">
            <span className="text-label-md font-label-md text-on-surface dark:text-inverse-on-surface">Godavari Riverfront Zoning</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant dark:text-inverse-on-surface">Oct 10, 2023</span>
          </button>
        </div>
      </section>

      {/* Expansive Chat Interface (Center) */}
      <section className="flex-1 flex flex-col relative bg-background dark:bg-background">
        {/* Thread Area */}
        <div className="flex-1 overflow-y-auto chat-scroll p-4 md:p-8 pb-32">
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map(msg => {
              const isAI = msg.sender === 'ai';
              const isSpeakingThis = speakingMsgId === msg.id;

              return (
                <div key={msg.id} className={`flex gap-4 max-w-[85%] ${isAI ? '' : 'ml-auto justify-end'}`}>
                  {isAI && (
                    <div className="w-10 h-10 rounded-full bg-surface-tint dark:bg-primary text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <span className="material-symbols-outlined">psychology</span>
                    </div>
                  )}

                  <div className={`p-5 rounded-xl shadow-sm ${
                    isAI 
                      ? `bg-white dark:bg-surface-dim border border-outline-variant/50 dark:border-outline/50 rounded-tl-none flex-1 space-y-5 ${msg.error ? 'border-error text-error' : ''}`
                      : 'bg-primary dark:bg-primary-container text-white dark:text-on-primary-container rounded-tr-none'
                  }`}>
                    {isAI ? (
                      <>
                        <div className="text-body-md font-body-md text-on-surface dark:text-inverse-on-surface whitespace-pre-line">
                          {msg.text}
                        </div>
                        
                        {/* Audio Controls */}
                        {!msg.error && (
                          <div className="flex items-center space-x-2 pt-2 border-t border-outline-variant/30">
                            <button
                              onClick={() => isSpeakingThis ? stopSpeaking() : speakText(msg.text, msg.lang || language, msg.id)}
                              className={`flex items-center gap-1 text-label-sm font-label-sm cursor-pointer transition-colors ${
                                isSpeakingThis 
                                  ? 'text-primary dark:text-primary-fixed font-bold' 
                                  : 'text-outline hover:text-primary dark:hover:text-primary-fixed'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">volume_up</span>
                              {isSpeakingThis ? 'Stop Audio' : 'Listen'}
                            </button>
                          </div>
                        )}

                        {/* Maps/Recommendations */}
                        {msg.data?.recommendations && msg.data.recommendations.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {msg.data.recommendations.map((rec, idx) => (
                              <div key={idx} className="border border-outline-variant dark:border-outline rounded-xl overflow-hidden bg-surface-bright dark:bg-surface flex flex-col transition-shadow hover:shadow-md">
                                <div className="h-32 bg-surface-container-high relative">
                                  <div className="w-full h-full bg-cover bg-center opacity-80 bg-slate-300 dark:bg-slate-700"></div>
                                  {rec.score && (
                                    <div className="absolute top-2 right-2 bg-on-tertiary-container text-white px-2 py-1 rounded text-label-sm font-label-sm font-bold flex items-center gap-1 shadow-sm">
                                      <span className="material-symbols-outlined text-[14px]">check_circle</span> {rec.score}% Match
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                  <h4 className="text-title-lg font-title-lg text-on-surface dark:text-inverse-on-surface mb-1">{rec.name}</h4>
                                  <p className="text-label-sm font-body-sm text-on-surface-variant dark:text-outline mb-4">{rec.reasons?.join(', ') || 'Verified Site'}</p>
                                  <div className="mt-auto flex justify-between items-center border-t border-outline-variant dark:border-outline pt-3">
                                    <Link to={`/gis?lat=${rec.latitude || rec.lat || ''}&lng=${rec.longitude || rec.lng || ''}&featureId=${encodeURIComponent(rec.name)}`} className="text-label-sm font-label-md text-primary dark:text-primary-fixed flex items-center gap-1 cursor-pointer hover:underline">
                                      <span className="material-symbols-outlined text-[16px]">map</span> View on map
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-body-md font-body-md">{msg.text}</p>
                    )}
                  </div>

                  {!isAI && (
                    <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0 border border-outline-variant dark:border-outline mt-1">
                       <img alt="User" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgQH7-Dh858Zj44zNb3kTbZgxgwahxnrTHU5YBFJqjpfB7S_u5UQj0wf0eibVtPY_lUOfp_CwhgydZujIrk6TutbShl9xKtWkYQ_21XfLscNATMtrglY-SAvejNaXRgvKR6P8rvwxQCMMVbdm7n1KwI8Y7kdrFaNh4r-oGhqTTZwLTpKhvcqKh3WLQDp1_9QkrhsA3EQyCbxfk3VuxJ2y5E6ogx8ikwnnMSf5-uzn17AfjOr4COnmT4Q"/>
                    </div>
                  )}
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex gap-4 max-w-full">
                <div className="w-10 h-10 rounded-full bg-surface-tint dark:bg-primary text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                </div>
                <div className="bg-white dark:bg-surface-dim p-4 rounded-xl shadow-sm border border-outline-variant/50 dark:border-outline/50 rounded-tl-none flex items-center text-on-surface-variant dark:text-outline text-body-md">
                  Analyzing data and preparing response...
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area (Bottom Fixed) */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4 md:px-8 pointer-events-none">
          <div className="max-w-4xl mx-auto flex flex-col gap-3 pointer-events-auto">
            
            {/* Prompt Suggestions */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {suggestedQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={isTyping}
                  className="shrink-0 bg-white dark:bg-surface border border-outline-variant dark:border-outline rounded-full px-4 py-2 text-label-sm font-label-md text-on-surface-variant dark:text-inverse-on-surface hover:bg-surface-container-low dark:hover:bg-surface-dim hover:border-primary/50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed">analytics</span> {q}
                </button>
              ))}
            </div>

            {/* Main Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative bg-white dark:bg-surface-dim rounded-2xl shadow-md border border-outline-variant dark:border-outline focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-end p-2"
            >
              <button type="button" className="p-3 text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed rounded-full hover:bg-surface-container-low dark:hover:bg-surface transition-colors shrink-0 cursor-pointer">
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <textarea 
                className="w-full bg-transparent border-none focus:ring-0 resize-none text-body-md font-body-md p-3 max-h-32 min-h-[52px] text-on-surface dark:text-inverse-on-surface placeholder:text-outline" 
                placeholder="Ask AI Planner to analyze data, suggest sites, or generate reports..." 
                rows="1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              ></textarea>
              
              <button 
                type="button" 
                onClick={handleVoiceInput}
                className={`p-3 rounded-full hover:bg-surface-container-low dark:hover:bg-surface transition-colors shrink-0 ml-1 mb-1 cursor-pointer ${isListening ? 'text-error animate-pulse' : 'text-on-surface-variant dark:text-outline hover:text-primary'}`}
              >
                <span className="material-symbols-outlined">{isListening ? 'mic' : 'mic_none'}</span>
              </button>
              
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-3 bg-primary text-white rounded-xl hover:bg-surface-tint transition-colors shrink-0 ml-1 mb-1 shadow-sm flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined" data-weight="fill">send</span>
              </button>
            </form>
            <p className="text-center text-[10px] text-outline font-label-sm">AI Planner can make mistakes. Always verify critical planning data against official GIS records.</p>
          </div>
        </div>
      </section>
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default AiPlannerPage;
