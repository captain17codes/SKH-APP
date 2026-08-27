import React from 'react';

const DocumentCard = ({ document, onPreview, onDownload }) => {
  const getIconData = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf': return { icon: 'picture_as_pdf', colorClass: 'text-error bg-error-container' };
      case 'docx':
      case 'doc': return { icon: 'description', colorClass: 'text-primary bg-primary-fixed' };
      case 'xlsx':
      case 'csv': return { icon: 'table', colorClass: 'text-secondary bg-secondary-container/50' };
      case 'zip':
      case 'rar': return { icon: 'folder_zip', colorClass: 'text-tertiary bg-tertiary-container/50' };
      default: return { icon: 'insert_drive_file', colorClass: 'text-on-surface-variant bg-surface-container-high' };
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Development Plan': return 'bg-primary-container/10 text-primary';
      case 'Infrastructure': return 'bg-secondary/10 text-secondary';
      case 'Financial': return 'bg-tertiary-container/10 text-tertiary';
      case 'Legal': return 'bg-surface-tint/10 text-surface-tint';
      default: return 'bg-surface-container-high text-on-surface-variant';
    }
  };

  const iconData = getIconData(document.fileType);
  const categoryColor = getCategoryColor(document.category);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-5 hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none"></div>
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconData.colorClass}`}>
          <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {iconData.icon}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={() => onPreview(document)} className="text-on-surface-variant hover:text-primary p-1 rounded-md hover:bg-surface-container-high transition-colors cursor-pointer" title="Preview">
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </button>
          <button onClick={() => onDownload(document)} className="text-on-surface-variant hover:text-primary p-1 rounded-md hover:bg-surface-container-high transition-colors cursor-pointer" title="Download">
            <span className="material-symbols-outlined text-[20px]">download</span>
          </button>
        </div>
      </div>
      
      <h3 className="text-title-lg font-title-lg text-on-surface mb-2 line-clamp-2 leading-tight">
        {document.title}
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`inline-block px-2.5 py-1 rounded-md text-label-sm font-label-sm ${categoryColor}`}>
          {document.category}
        </span>
        <span className="inline-block bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-md text-label-sm font-label-sm border border-outline-variant/50">
          {document.size}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-4 border-t border-outline-variant/30">
        <div className="flex items-center gap-2 truncate pr-2">
          <span className="material-symbols-outlined text-[16px]">account_circle</span>
          <span className="truncate">{document.author || 'System Gen'}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          <span>{document.date}</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
