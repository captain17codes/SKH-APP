import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Sparkles, Trash2 } from 'lucide-react';
import AIMessage from './AIMessage';
import PromptSuggestions from './PromptSuggestions';
import { aiPlannerService } from '../../services/api';
import toast from 'react-hot-toast';

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am the Kopargaon Smart City AI Urban Planner. Ask me to find optimal hospital locations, analyze traffic bottlenecks, evaluate unused land, or optimize municipal budget allocation.',
      data: null
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleClear = () => {
    setMessages([messages[0]]);
    toast.success('AI Conversation history cleared');
  };

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsTyping(true);

    try {
      const responseData = await aiPlannerService.queryAI(textToSend);
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: responseData.answer || responseData.text || responseData.rationale || 'Analysis complete.',
        data: responseData
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      toast.error('AI Planner service encountered an error.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Kopargaon AI Urban Planner</h3>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-ping" />
              AI Spatial Assistant 2.0 Live
            </span>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
          title="Clear Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Message History */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <AIMessage key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 font-medium p-3 bg-blue-500/10 rounded-xl w-fit">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing Kopargaon spatial GIS layers & demographic vectors...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Input Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
        <PromptSuggestions onSelectPrompt={(p) => handleSend(p)} />

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
            placeholder="Ask AI Urban Planner (e.g. Find hospital site in Ward 3)..."
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
