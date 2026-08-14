import React from 'react';
import Modal from '../common/Modal';
import { Download, FileText, Calendar, HardDrive, User, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
  if (!document) return null;

  const handleDownload = () => {
    toast.success(`Downloading ${document.title} (${document.size})...`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Document Viewer - ${document.category}`}>
      <div className="space-y-4 text-xs">
        <div className="flex items-start space-x-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">{document.fileType} • {document.size}</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{document.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Author / Authority: {document.author}</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-slate-100">Document Summary & Executive Digest</h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{document.summary}</p>
        </div>

        {/* Mock Document Viewer Screen */}
        <div className="h-48 bg-slate-950 rounded-xl p-4 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="text-emerald-400 border-b border-slate-800 pb-1 mb-2">
              [OFFICIAL SEAL] KOPARGAON MUNICIPAL COUNCIL — TOWN PLANNING CELL
            </div>
            <p className="text-slate-400">--- BEGIN ENCRYPTED DOCUMENT PREVIEW ---</p>
            <p className="mt-2">SECTION 1.0: REGULATORY COMPLIANCE AND ZONAL MAP ATTACHMENT</p>
            <p>Verification Hash: 8f9a2b4e7c1d3f-KPG-2026</p>
            <p className="text-slate-400">Status: Verified & Digital Signed by Chief Officer</p>
          </div>
          <div className="text-[10px] text-slate-500 text-right">Page 1 of 24 (Live Preview)</div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Official File</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentPreviewModal;
