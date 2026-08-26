import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

const FilterPanel = ({ filters, selectedFilters, onFilterChange, onReset, className = "" }) => {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 ${className}`}>
      <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
        <Filter className="w-3.5 h-3.5 mr-1" />
        {t('filter') || 'Filters'}
      </div>

      {filters.map((filter) => (
        <select
          key={filter.key}
          value={selectedFilters[filter.key] || ''}
          onChange={(e) => onFilterChange(filter.key, e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">{t('All')} {t(filter.label)}</option>
          {filter.options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {t(label)}
              </option>
            );
          })}
        </select>
      ))}

      {onReset && (
        <button
          onClick={onReset}
          className="flex items-center text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 ml-auto transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </button>
      )}
    </div>
  );
};

export default FilterPanel;
