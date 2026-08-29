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

            {/* Structured Active Projects Cards */}
            {message.data?.projects && message.data.projects.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Active Smart City Projects ({message.data.projects.length})
                </span>
                <div className="space-y-2">
                  {message.data.projects.map((prj, idx) => {
                    const coords = prj.coordinates || [19.8830, 74.4880];
                    const lat = coords[0];
                    const lng = coords[1];
                    return (
                      <div
                        key={prj.id || idx}
                        className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{prj.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {prj.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <span>📍 {prj.ward || prj.location}</span>
                            <span>🏢 {prj.department || prj.category}</span>
                            {prj.progress !== undefined && <span>📊 {prj.progress}%</span>}
                          </div>
                        </div>
                        <Link
                          to={`/gis?lat=${lat}&lng=${lng}&zoom=16&featureId=${encodeURIComponent(prj.id || prj.name)}&featureType=project`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1 flex-shrink-0 transition-all shadow-xs"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>📍 View on Map</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MCP Action Triggers (View on Map) */}
            {message.data?.mapAction && !message.data?.projects && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                <Link
                  to={`/gis?lat=${message.data.mapAction.latitude || ''}&lng=${message.data.mapAction.longitude || ''}&zoom=${message.data.mapAction.zoom || 15}&featureId=${encodeURIComponent(message.data.mapAction.featureId || message.data.mapAction.projectId || '')}&featureType=${encodeURIComponent(message.data.mapAction.targetType || message.data.mapAction.featureType || 'project')}`}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>📍 View on Map</span>
                </Link>

                {(message.data.mapAction.featureId || message.data.mapAction.projectId) && (
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-mono">
                    ID: {message.data.mapAction.featureId || message.data.mapAction.projectId}
                  </span>
                )}
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
