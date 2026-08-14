import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorState = ({ title = "Failed to load data", message = "An error occurred while connecting to the Kopargaon GIS service.", onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-500/5 border border-rose-500/20 rounded-xl my-4">
      <div className="p-3 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">{title}</h4>
      <p className="text-xs text-rose-600/80 dark:text-rose-400/80 max-w-md mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};

export default ErrorState;
