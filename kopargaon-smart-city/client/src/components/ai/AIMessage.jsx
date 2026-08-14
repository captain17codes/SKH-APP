import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, User, Sparkles, CheckCircle2, MapPin, Plus } from 'lucide-react';

const AIMessage = ({ message }) => {
  const isAI = message.sender === 'ai';

  const formatText = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('###')) {
        return <h4 key={idx} className="font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1 text-xs uppercase tracking-wider">{line.replace('###', '').trim()}</h4>;
      }
      if (line.startsWith('##')) {
        return <h3 key={idx} className="font-bold text-slate-950 dark:text-slate-50 mt-4 mb-2 text-sm">{line.replace('##', '').trim()}</h3>;
      }
      if (line.startsWith('- ✓') || line.startsWith('-')) {
        return (
          <div key={idx} className="flex items-start text-slate-700 dark:text-slate-300 mt-1 pl-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 mt-0.5 flex-shrink-0" />
            <span>{line.replace('- ✓', '').replace('-', '').trim()}</span>
          </div>
        );
      }
      return <p key={idx} className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">{line}</p>;
    });
  };

  return (
    <div className={`flex items-start space-x-3 ${isAI ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}>
      {isAI && (
        <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md flex-shrink-0">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-2xl rounded-2xl p-4 text-xs ${
        isAI
          ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm space-y-3'
          : 'bg-blue-600 text-white shadow-md'
      }`}>
        {/* User Prompt Message */}
        {!isAI && <p>{message.text}</p>}

        {/* Structured AI Response */}
        {isAI && (
          <>
            <div className="space-y-2">
              {formatText(message.text)}
            </div>

            {/* MCP Action Triggers (View Map / Create Project Pre-fills) */}
            {message.data?.mapAction && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                <Link
                  to={`/gis?lat=${message.data.mapAction.latitude}&lng=${message.data.mapAction.longitude}&zoom=${message.data.mapAction.zoom}`}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>View on GIS Map</span>
                </Link>

                <Link
                  to={`/projects?create=true&cat=${encodeURIComponent(message.data.intent === 'LOCATION_RECOMMENDATION' ? 'Healthcare' : 'Infrastructure')}&lat=${message.data.mapAction.latitude}&lng=${message.data.mapAction.longitude}&desc=${encodeURIComponent(`Project recommended by AI Planner for suitability site.`)}`}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Project</span>
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {!isAI && (
        <div className="p-2 rounded-xl bg-slate-800 text-white flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default AIMessage;
