import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, MessageSquareWarning, FileText, MapPin, X } from 'lucide-react';
import { MOCK_PROJECTS, MOCK_COMPLAINTS, MOCK_DOCUMENTS, KOPARGAON_WARDS_GEOJSON } from '../../data/mockData';

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const lowerQuery = query.toLowerCase().trim();

  const matchedProjects = lowerQuery
    ? MOCK_PROJECTS.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.ward.toLowerCase().includes(lowerQuery) || p.department.toLowerCase().includes(lowerQuery))
    : [];

  const matchedComplaints = lowerQuery
    ? MOCK_COMPLAINTS.filter(c => c.title.toLowerCase().includes(lowerQuery) || c.category.toLowerCase().includes(lowerQuery) || c.ward.toLowerCase().includes(lowerQuery))
    : [];

  const matchedDocs = lowerQuery
    ? MOCK_DOCUMENTS.filter(d => d.title.toLowerCase().includes(lowerQuery) || d.category.toLowerCase().includes(lowerQuery))
    : [];

  const matchedWards = lowerQuery
    ? KOPARGAON_WARDS_GEOJSON.features.filter(f => f.properties.name.toLowerCase().includes(lowerQuery) || f.properties.councillor.toLowerCase().includes(lowerQuery))
    : [];

  const hasResults = matchedProjects.length > 0 || matchedComplaints.length > 0 || matchedDocs.length > 0 || matchedWards.length > 0;

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, wards, complaints, documents..."
            className="w-full text-sm bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none placeholder-slate-400"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="text-center py-8 text-xs text-slate-400">
              Type to search Kopargaon GIS spatial layers, projects, grievances, or planning documents.
            </div>
          )}

          {query && !hasResults && (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching smart city records found for "<span className="font-semibold text-slate-700 dark:text-slate-300">{query}</span>"
            </div>
          )}

          {matchedProjects.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Projects</span>
              <div className="space-y-1">
                {matchedProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(`/projects/${p.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-500/10 dark:hover:bg-blue-500/10 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <FolderKanban className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{p.name}</p>
                        <span className="text-[10px] text-slate-500">{p.ward} • {p.status}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">₹{(p.budget / 10000000).toFixed(1)} Cr</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedWards.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Wards</span>
              <div className="space-y-1">
                {matchedWards.map(w => (
                  <div
                    key={w.id}
                    onClick={() => handleSelect(`/gis?ward=${w.properties.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-emerald-500/10 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{w.properties.name}</p>
                        <span className="text-[10px] text-slate-500">Councillor: {w.properties.councillor}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{w.properties.population.toLocaleString()} pop</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedComplaints.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Complaints</span>
              <div className="space-y-1">
                {matchedComplaints.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect('/complaints')}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-500/10 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <MessageSquareWarning className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">{c.title}</p>
                        <span className="text-[10px] text-slate-500">{c.category} • {c.ward}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedDocs.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Documents</span>
              <div className="space-y-1">
                {matchedDocs.map(d => (
                  <div
                    key={d.id}
                    onClick={() => handleSelect('/documents')}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-purple-500/10 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">{d.title}</p>
                        <span className="text-[10px] text-slate-500">{d.category} • {d.fileType}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{d.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
