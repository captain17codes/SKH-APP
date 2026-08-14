import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';
import { MapPin, Cpu, AlertTriangle, Crosshair } from 'lucide-react';

const CATEGORIES = [
  'Road Damage', 'Water Leakage', 'Garbage', 'Street Light',
  'Drainage', 'Illegal Construction', 'Traffic', 'Electricity',
  'Public Infrastructure', 'Other'
];

const WARDS = [
  'Ward 1 - Sangamner Naka',
  'Ward 2 - Riverbank',
  'Ward 3 - Laxmi Nagar',
  'Ward 4 - Yesgaon Bypass',
  'Ward 5 - MIDC Zone',
  'Ward 6 - Samvatsar Border',
  'Ward 7 - Subhash Road'
];

const PRIORITY_COLORS = {
  CRITICAL: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-300 dark:border-rose-700', label: '🚨 CRITICAL' },
  HIGH:     { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700', label: '🔴 HIGH' },
  MEDIUM:   { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700', label: '🟡 MEDIUM' },
  LOW:      { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-700', label: '🟢 LOW' }
};

const NewComplaintModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Road Damage',
    ward: 'Ward 1 - Sangamner Naka',
    location: '',
    description: '',
    reporterName: '',
    reporterContact: ''
  });
  const [coordinates, setCoordinates] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { priority, aiScore, aiReasons }

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoordinates([lat, lng]);
        toast.success(`📍 Location captured: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setLocating(false);
      },
      () => {
        // Fallback to Kopargaon center with slight random offset for demo
        const lat = 19.8917 + (Math.random() - 0.5) * 0.02;
        const lng = 74.4789 + (Math.random() - 0.5) * 0.02;
        setCoordinates([lat, lng]);
        toast('Using approximate Kopargaon location (GPS unavailable)', { icon: '⚠️' });
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.location.trim()) {
      toast.error('Please enter issue title and location.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        coordinates: coordinates || [
          19.8917 + (Math.random() - 0.5) * 0.02,
          74.4789 + (Math.random() - 0.5) * 0.02
        ]
      };
      const result = await onSubmit(payload);
      // Show AI result if available
      if (result && result.priority) {
        setAiResult({ priority: result.priority, aiScore: result.aiScore, aiReasons: result.aiReasons });
        toast.success(`✅ Grievance lodged! AI Priority: ${result.priority}`);
      } else {
        toast.success('Grievance lodged successfully!');
        handleClose();
      }
    } catch (err) {
      toast.error('Failed to submit grievance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ title: '', category: 'Road Damage', ward: 'Ward 1 - Sangamner Naka', location: '', description: '', reporterName: '', reporterContact: '' });
    setCoordinates(null);
    setAiResult(null);
    onClose();
  };

  const pc = aiResult ? (PRIORITY_COLORS[aiResult.priority] || PRIORITY_COLORS.MEDIUM) : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🏛️ Lodge Citizen Grievance">
      {/* AI Priority Result Panel */}
      {aiResult && pc && (
        <div className={`mb-4 p-4 rounded-xl border-2 ${pc.bg} ${pc.border}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">AI Priority Assessment</span>
            </div>
            <span className={`text-sm font-black ${pc.text}`}>{pc.label}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">AI Score</span>
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${aiResult.priority === 'CRITICAL' ? 'bg-rose-500' : aiResult.priority === 'HIGH' ? 'bg-orange-500' : aiResult.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${aiResult.aiScore}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${pc.text}`}>{aiResult.aiScore}/100</span>
          </div>
          {aiResult.aiReasons && aiResult.aiReasons.length > 0 && (
            <ul className="space-y-0.5">
              {aiResult.aiReasons.map((r, i) => (
                <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">•</span>{r}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[10px] text-slate-400 italic">AI priority is a recommendation. Admin can override the final priority.</p>
          <button
            onClick={handleClose}
            className="mt-3 w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors"
          >
            Done — Close
          </button>
        </div>
      )}

      {/* Form */}
      {!aiResult && (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Title *</label>
            <input
              type="text" required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Broken streetlight fixture near Somaiya College"
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Category + Ward */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Problem Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ward Location</label>
              <select
                value={formData.ward}
                onChange={e => setFormData({ ...formData, ward: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {WARDS.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>

          {/* Location + GPS */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Specific Address / Landmark *</label>
            <input
              type="text" required
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Opposite Municipal Water Tank, Station Road"
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* GPS Pin */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${coordinates ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'}`}>
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold transition-colors shrink-0"
            >
              <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Locating...' : coordinates ? 'Re-capture GPS' : 'Use My Location'}
            </button>
            <span className="text-slate-600 dark:text-slate-400">
              {coordinates
                ? <><span className="text-emerald-600 dark:text-emerald-400 font-semibold">📍 GPS Captured</span> {coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}</>
                : <span className="text-slate-400">No GPS — a Kopargaon default will be used</span>
              }
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue — the AI uses severity keywords from here to score priority..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Reporter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Citizen Full Name</label>
              <input
                type="text"
                value={formData.reporterName}
                onChange={e => setFormData({ ...formData, reporterName: e.target.value })}
                placeholder="Your Name"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Contact</label>
              <input
                type="text"
                value={formData.reporterContact}
                onChange={e => setFormData({ ...formData, reporterContact: e.target.value })}
                placeholder="+91 98*** *****"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* AI notice */}
          <div className="flex items-start gap-2 p-2.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
            <Cpu className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-violet-700 dark:text-violet-400">
              After submission, the <strong>AI Priority Engine</strong> will score this complaint based on category severity, description keywords, proximity to infrastructure, and ward density.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button" onClick={handleClose}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold shadow-md transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <><span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" /> Analyzing...</>
              ) : (
                <><MapPin className="w-3.5 h-3.5" /> Submit Grievance</>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default NewComplaintModal;
