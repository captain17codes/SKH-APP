import React from 'react';
import { Sparkles } from 'lucide-react';
import { AI_SUGGESTED_PROMPTS } from '../../data/mockData';

const PromptSuggestions = ({ onSelectPrompt }) => {
  return (
    <div className="space-y-2">
      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
        Suggested AI Urban Planning Prompts:
      </span>
      <div className="flex flex-wrap gap-2">
        {AI_SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(prompt)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3 h-3 flex-shrink-0" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptSuggestions;
