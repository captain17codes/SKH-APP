import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const ProjectTimeline = ({ timeline = [] }) => {
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {timeline.map((event, index) => {
        const isCompleted = event.status === 'completed';
        const isInProgress = event.status === 'in-progress';

        return (
          <div key={index} className="relative flex items-start space-x-3 group">
            {/* Timeline Icon Node */}
            <div
              className={`absolute -left-6 top-0.5 p-0.5 rounded-full bg-white dark:bg-slate-900 border-2 transition-colors ${
                isCompleted
                  ? 'border-emerald-500 text-emerald-500'
                  : isInProgress
                  ? 'border-blue-500 text-blue-500 animate-pulse'
                  : 'border-slate-300 dark:border-slate-700 text-slate-400'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 fill-emerald-500/10" />
              ) : isInProgress ? (
                <Clock className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700" />
              )}
            </div>

            {/* Event Content */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 w-full shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{event.title}</h4>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{event.date}</span>
              </div>
              {event.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{event.description}</p>
              )}
              <div className="mt-2">
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : isInProgress
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {event.status}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectTimeline;
