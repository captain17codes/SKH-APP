import React, { useState, useEffect } from 'react';
import { FileText, Plus, Upload, Search, Download } from 'lucide-react';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import UploadDocumentModal from '../components/documents/UploadDocumentModal';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';
import { documentService } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORY_TABS = [
  'All Documents',
  'DPR',
  'Development Plan',
  'Land Survey',
  'Project Tender',
  'Infrastructure Report'
];

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    documentService.getAll().then(setDocuments);
  }, []);

  const filteredDocs = documents.filter(d => {
    const matchesCategory = selectedCategory === 'All Documents' || d.category === selectedCategory;
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDownload = (doc) => {
    toast.success(`Downloading ${doc.title}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <FileText className="w-5 h-5 text-blue-500 mr-2" />
            Digital Document Repository & Master Archive
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure digital vault for Kopargaon Detailed Project Reports (DPR), land surveys, tenders, and municipal Gazette maps.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5 w-fit"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedCategory(tab)}
              className={`px-3.5 py-1.5 rounded-lg border font-semibold flex-shrink-0 transition-colors ${
                selectedCategory === tab
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search documents..."
          className="w-full md:w-64"
        />
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          title="No Documents Found"
          description="No official records match your selected category tab or search query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPreview={(d) => {
                setPreviewDoc(d);
                setIsPreviewOpen(true);
              }}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={previewDoc}
      />

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={(newDoc) => setDocuments(prev => [newDoc, ...prev])}
      />
    </div>
  );
};

export default DocumentsPage;
