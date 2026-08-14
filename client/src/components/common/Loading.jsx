import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ text = "Loading Kopargaon GIS dataset...", size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full text-slate-500 dark:text-slate-400">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-blue-600 dark:text-blue-400 mb-3`} />
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );
};

export default Loading;
