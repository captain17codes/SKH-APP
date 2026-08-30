import React, { useState } from 'react';
import Modal from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import { MapPin, User, Calendar, Phone, CheckCircle2, Shield, Cpu, BarChart3, Info, Camera, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../../context/LanguageContext';
import { maskPhoneNumber, getComplaintPhotos } from '../../utils/complaintUtils';

const PRIORITY_CONFIG = {
  CRITICAL: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30', bar: 'bg-rose-500', label: '🚨 CRITICAL' },
  HIGH:     { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', bar: 'bg-orange-500', label: '🔴 HIGH' },
  MEDIUM:   { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', bar: 'bg-amber-500', label: '🟡 MEDIUM' },
  LOW:      { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', bar: 'bg-emerald-500', label: '🟢 LOW' },
  // Fallback for legacy "High", "Medium" etc
  High:     { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', bar: 'bg-orange-500', label: '🔴 HIGH' },
  Medium:   { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', bar: 'bg-amber-500', label: '🟡 MEDIUM' },
  Low:      { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', bar: 'bg-emerald-500', label: '🟢 LOW' }
};

const ComplaintModal = ({ isOpen, onClose, complaint, onUpdateStatus }) => {
  const { t } = useTranslation();
  const [newStatus, setNewStatus] = useState('');
  const [overridePriority, setOverridePriority] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!complaint) return null;

  const pc = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.MEDIUM;
  const aiScore = complaint.aiScore || null;
  const aiReasons = complaint.aiReasons || [];
  const complaintPhotos = getComplaintPhotos(complaint);

  const handleStatusChange = () => {
    if (!newStatus) return;
    onUpdateStatus(complaint.id, newStatus);
    toast.success(`Complaint #${complaint.id} status updated to '${newStatus}'`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Grievance Record #${complaint.id}`}>
      <div className="space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {complaint.category}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{complaint.title}</h3>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        {/* Location & Reporter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Location & Ward</span>
            <div className="flex items-center text-slate-800 dark:text-slate-200 font-medium mt-0.5">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {complaint.location} {complaint.ward && `(${complaint.ward})`}
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Reported By</span>
            <div className="flex items-center text-slate-800 dark:text-slate-200 font-medium mt-0.5">
              <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Anonymous Citizen
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Reported Date</span>
            <div className="flex items-center text-slate-800 dark:text-slate-200 font-medium mt-0.5">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {complaint.reportedDate || 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Upvotes</span>
            <div className="flex items-center text-slate-800 dark:text-slate-200 font-medium mt-0.5">
              👍 {complaint.upvotes || 0} citizens endorsed
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Issue Description</span>
          <p className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
            {complaint.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Ground Evidence Photos */}
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            Ground Evidence Photos
          </span>
          {complaintPhotos.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {complaintPhotos.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedPhoto(url)}
                  className="relative group shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  title="Click to view larger preview"
                >
                  <img
                    src={url}
                    alt={`Evidence ${i + 1}`}
                    className="w-20 h-20 object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                    View
                  </span>
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-white text-[8px] font-mono pointer-events-none">
                    #{i + 1}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] italic flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 opacity-60" />
              No ground photos attached.
            </div>
          )}
        </div>

        {/* Enlarged Photo Lightbox Modal */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setSelectedPhoto(null)}
          >
            <div 
              className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 p-3 flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full flex justify-between items-center px-1 pb-2 text-slate-300 text-xs border-b border-slate-800 mb-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-500" />
                  Ground Evidence Photo
                </span>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img 
                src={selectedPhoto} 
                alt="Ground Evidence Enlarged" 
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain" 
              />
            </div>
          </div>
        )}

        {/* AI Observation */}
        {complaint.aiObservation && (
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-cyan-500">🤖 AI Observation</span>
            <p className="text-xs font-semibold">{complaint.aiObservation}</p>
            <span className="text-[9px] text-slate-400 block">Automated visual & natural language analysis — subject to officer verification.</span>
          </div>
        )}

        {/* AI Priority Engine Section */}
        <div className={`p-3 rounded-xl border ${pc.bg} border-opacity-50`} style={{ borderColor: 'currentColor' }}>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">AI Priority Engine Result</span>
            <span className={`ml-auto text-xs font-black ${pc.color}`}>{pc.label.split(' ')[0]} {t(pc.label.split(' ')[1])}</span>
          </div>

          {aiScore !== null && (
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">Priority Score</span>
              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${pc.bar}`}
                  style={{ width: `${aiScore}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold ${pc.color} shrink-0`}>{aiScore}/100</span>
            </div>
          )}

          {aiReasons.length > 0 ? (
            <ul className="space-y-0.5">
              {aiReasons.map((r, i) => (
                <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">•</span>{r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-slate-400 italic">AI reasoning data not available for this record.</p>
          )}

          <p className="mt-2 text-[10px] text-slate-400 italic flex items-center gap-1">
            <Info className="w-3 h-3" />
            AI priority is advisory. Admin override via status update below.
          </p>
        </div>

        {/* Assigned Dept */}
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span>Dept: <strong className="text-slate-900 dark:text-slate-100">{complaint.assignedDept || 'Public Works'}</strong></span>
          {complaint.coordinates && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="font-mono">{complaint.coordinates[0]?.toFixed(5)}, {complaint.coordinates[1]?.toFixed(5)}</span>
            </span>
          )}
        </div>

        {/* Admin Status Update */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            Update Grievance Status (Municipal Action)
          </label>
          <div className="flex items-center space-x-2">
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Action Status...</option>
              <option value="Pending">{t('Pending')}</option>
              <option value="Under Review">{t('Under Review')}</option>
              <option value="In Progress">{t('In Progress')}</option>
              <option value="Resolved">{t('Resolved')}</option>
            </select>
            <button
              onClick={handleStatusChange}
              disabled={!newStatus}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ComplaintModal;
