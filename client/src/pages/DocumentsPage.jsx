import React, { useState, useEffect } from 'react';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import UploadDocumentModal from '../components/documents/UploadDocumentModal';
import { documentService } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORY_TABS = [
  'All Documents',
  'Development Plan',
  'Infrastructure',
  'Legal',
  'Financial'
];

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('Any Time');

  useEffect(() => {
    documentService.getAll().then(setDocuments);
  }, []);

  const filteredDocs = documents.filter(d => {
    const matchesCategory = selectedCategory === 'All Documents' || d.category === selectedCategory;
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.author && d.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (d.id && d.id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDownload = (doc) => {
    toast.success(`Downloading ${doc.title}...`);
  };

  const getCategoryCount = (cat) => {
    if (cat === 'All Documents') return documents.length;
    return documents.filter(d => d.category === cat).length;
  };

  return (
    <div className="flex flex-col h-full -mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-outline-variant/30 bg-surface">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">Document Library</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">Manage and access all municipal documents and records.</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2.5 rounded-lg text-label-md font-label-md flex items-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-secondary focus:ring-offset-2 cursor-pointer w-fit"
        >
          <span className="material-symbols-outlined text-[20px]">upload</span>
          Upload Document
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 p-4 sm:px-6 lg:px-8 gap-6 overflow-hidden">
        {/* Filter Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6 h-fit md:sticky md:top-6">
          <h3 className="text-title-lg font-title-lg text-on-surface mb-6 flex items-center gap-2 border-b border-outline-variant/50 pb-4">
            <span className="material-symbols-outlined text-primary">filter_list</span>
            Categories
          </h3>
          <div className="space-y-4">
            {CATEGORY_TABS.map(tab => (
              <label key={tab} className="flex items-center gap-3 group cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === tab}
                  onChange={() => setSelectedCategory(tab)}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/50 transition-colors cursor-pointer"
                />
                <span className={`text-body-md font-body-md group-hover:text-primary transition-colors ${selectedCategory === tab ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {tab}
                </span>
                <span className="ml-auto text-label-sm font-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  {getCategoryCount(tab)}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant/50">
            <h4 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-4">Date Added</h4>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-surface-bright border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary outline-none"
            >
              <option>Any Time</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          
          <div className="mt-8 pt-6 border-t border-outline-variant/50">
             <h4 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-4">Search</h4>
             <div className="relative">
               <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
               <input 
                 className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-9 pr-4 py-2 text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" 
                 placeholder="Search documents..." 
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
          </div>
        </aside>

        {/* Document Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredDocs.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-10 flex flex-col items-center justify-center text-center text-on-surface-variant h-full min-h-[400px]">
              <span className="material-symbols-outlined text-[48px] text-primary opacity-60 mb-4">folder_off</span>
              <h4 className="font-title-lg text-title-lg text-on-surface mb-2">No Documents Found</h4>
              <p className="font-body-sm text-body-sm max-w-sm">No official records match your selected category tab or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
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
        </div>
      </div>

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
