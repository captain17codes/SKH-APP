import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const FilterPanel = ({ filters, selectedFilters, onFilterChange, onReset, className = "" }) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 ${className}`}>
      <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
        <Filter className="w-3.5 h-3.5 mr-1" />
        Filters
      </div>

      {filters.map((filter) => (
        <select
          key={filter.key}
          value={selectedFilters[filter.key] || ''}
          onChange={(e) => onFilterChange(filter.key, e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All {filter.label}</option>
          {filter.options.map((opt) => (
            <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
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
