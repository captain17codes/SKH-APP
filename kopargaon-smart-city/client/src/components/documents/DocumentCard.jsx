import React from 'react';
import { FileText, Download, Eye, Calendar, HardDrive } from 'lucide-react';

const DocumentCard = ({ document, onPreview, onDownload }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            {document.category}
          </span>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{document.fileType}</span>
        </div>

        {/* Title */}
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">{document.title}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{document.summary}</p>
          </div>
        </div>
      </div>

      {/* Meta Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center"><HardDrive className="w-3 h-3 mr-1" /> {document.size}</span>
          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {document.date}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPreview(document)}
            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
            title="Preview Document"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownload(document)}
            className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
            title="Download Document"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
