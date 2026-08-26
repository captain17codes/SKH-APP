import React from 'react';
import { useTranslation } from '../../context/LanguageContext';

export const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  let colorClasses = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300';

  const lower = (status || '').toLowerCase();
  if (lower.includes('completed') || lower.includes('resolved') || lower.includes('high')) {
    colorClasses = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  } else if (lower.includes('ongoing') || lower.includes('in progress') || lower.includes('in_progress')) {
    colorClasses = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  } else if (lower.includes('planning') || lower.includes('planned') || lower.includes('pending') || lower.includes('medium')) {
    colorClasses = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  } else if (lower.includes('critical') || lower.includes('delayed') || lower.includes('urgent') || lower.includes('rejected') || lower.includes('cancelled')) {
    colorClasses = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {t(status || 'UNKNOWN')}
    </span>
  );
};

export const DepartmentBadge = ({ department }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      {department}
    </span>
  );
};

export const RiskBadge = ({ risk, score }) => {
  const { t } = useTranslation();
  let colorClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
  let icon = '⚪';

  const upper = (risk || '').toUpperCase();
  if (upper === 'CRITICAL') {
    colorClasses = 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
    icon = '🟣';
  } else if (upper === 'HIGH') {
    colorClasses = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    icon = '🔴';
  } else if (upper === 'MEDIUM') {
    colorClasses = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    icon = '🟠';
  } else if (upper === 'LOW') {
    colorClasses = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    icon = '🟢';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${colorClasses}`}>
      <span className="mr-1">{icon}</span>
      {t(upper)} {score !== undefined && score !== null && upper !== 'UNKNOWN' ? `(${score})` : ''}
    </span>
  );
};
