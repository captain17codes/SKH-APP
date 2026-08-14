import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ className = "" }) => {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className={`flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 ${className}`}>
      <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-1.5 shrink-0" />
      <div className="flex items-center text-[11px] font-bold">
        <button
          onClick={() => changeLanguage('en')}
          className={`px-2 py-1 rounded-lg transition-all ${
            language === 'en'
              ? 'bg-cyan-600 text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="English"
        >
          EN
        </button>

        <button
          onClick={() => changeLanguage('hi')}
          className={`px-2 py-1 rounded-lg transition-all ${
            language === 'hi'
              ? 'bg-cyan-600 text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="हिंदी"
        >
          हिंदी
        </button>

        <button
          onClick={() => changeLanguage('mr')}
          className={`px-2 py-1 rounded-lg transition-all ${
            language === 'mr'
              ? 'bg-cyan-600 text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="मराठी"
        >
          मराठी
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
