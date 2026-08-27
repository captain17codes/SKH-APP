import React from 'react';
import Modal from '../common/Modal';
import { Download, FileText, Calendar, HardDrive, User, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
  if (!document) return null;

  const handleDownload = () => {
    toast.success(`Downloading ${document.title} (${document.size})...`);
    
    // Simulate real file download
    const blob = new Blob([`Official Document Content:\n\nTitle: ${document.title}\nCategory: ${document.category}\nAuthor: ${document.author}\n\nSummary:\n${document.summary}`], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/\s+/g, '_')}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    window.document.body.removeChild(a);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Document Viewer - ${document.category}`}>
      <div className="space-y-6 text-sm font-body-md">
        <div className="flex items-start space-x-4 border-b border-outline-variant pb-4">
          <div className="p-3 bg-primary-container text-on-primary-container rounded-lg shrink-0">
            <FileText className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <span className="font-label-sm font-bold uppercase tracking-wider text-primary">{document.fileType} • {document.size}</span>
            <h3 className="font-title-lg text-on-surface mb-1">{document.title}</h3>
            <p className="font-body-sm text-on-surface-variant">Author / Authority: {document.author}</p>
          </div>
        </div>

        {/* Clean Document Viewer Screen */}
        <div className="h-64 bg-white dark:bg-slate-50 rounded-xl p-6 border border-outline-variant text-slate-900 shadow-inner overflow-y-auto flex flex-col">
          <div className="flex-1">
            <div className="border-b-2 border-slate-200 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">account_balance</span>
                <span className="font-bold text-slate-800 tracking-tight">KOPARGAON MUNICIPAL COUNCIL</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Town Planning Cell</span>
            </div>
            
            <h4 className="text-lg font-bold text-slate-900 mb-3 leading-snug">{document.title}</h4>
            
            <div className="prose prose-sm prose-slate mb-6">
              <p className="leading-relaxed text-slate-700">{document.summary}</p>
            </div>
            
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 text-xs text-slate-600 font-mono">
              <div className="flex justify-between items-center mb-1">
                <span>Reference ID: KPG-2026/DOC-{document.id || '8F9A2B'}</span>
                <span>Date: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold mt-2 bg-emerald-50 px-2 py-1 rounded inline-flex">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified & Digitally Signed by Chief Officer</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 text-center pt-4 mt-4 border-t border-slate-100">
            Page 1 of {document.pages || 24} (Preview)
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-on-surface font-label-md hover:bg-surface-container-low transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-label-md shadow-sm transition-colors flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download Official File</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentPreviewModal;
