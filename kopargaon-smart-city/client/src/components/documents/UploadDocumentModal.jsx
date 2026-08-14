import React, { useState } from 'react';
import Modal from '../common/Modal';
import { UploadCloud, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const UploadDocumentModal = ({ isOpen, onClose, onUpload }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Development Plan',
    fileType: 'PDF',
    author: 'Kopargaon Town Planning Office',
    summary: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Please enter document title');
      return;
    }

    onUpload({
      id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
      ...formData,
      size: '12.4 MB',
      date: new Date().toISOString().split('T')[0],
      downloads: 0
    });

    toast.success('Document uploaded to Smart City vault successfully!');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Official Planning Document">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Ward 4 Drainage System Hydrographic Audit Report"
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option>DPR</option>
              <option>Development Plan</option>
              <option>Land Survey</option>
              <option>Project Tender</option>
              <option>Infrastructure Report</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Format</label>
            <select
              value={formData.fileType}
              onChange={e => setFormData({ ...formData, fileType: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option>PDF</option>
              <option>ZIP / GeoJSON</option>
              <option>DWG / CAD</option>
              <option>XLSX</option>
            </select>
          </div>
        </div>

        {/* Drag & drop box simulation */}
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
          <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">Click to select or drag PDF file here</p>
          <span className="text-[10px] text-slate-400">Supported files: PDF, GeoJSON, DWG, ZIP up to 500 MB</span>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Executive Summary</label>
          <textarea
            rows="3"
            value={formData.summary}
            onChange={e => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Brief abstract of the document content..."
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-colors"
          >
            Upload File
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadDocumentModal;
