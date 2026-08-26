import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';
import { useTranslation } from '../../context/LanguageContext';

const ProjectModal = ({ isOpen, onClose, onCreate, onSave, initialData = null }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Road Construction',
    department: 'Public Works Department (PWD)',
    ward: 'Ward 1 - Sangamner Naka',
    budget: '',
    spent: '',
    progress: 0,
    status: 'IN_PROGRESS',
    startDate: '',
    expectedCompletion: '',
    contractor: '',
    engineer: '',
    description: '',
    note: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'Road Construction',
        department: initialData.department || 'Public Works Department (PWD)',
        ward: initialData.ward || 'Ward 1 - Sangamner Naka',
        budget: initialData.budget ? String(initialData.budget) : '',
        spent: initialData.spent ? String(initialData.spent) : '0',
        progress: initialData.progress ?? 0,
        status: initialData.status || 'IN_PROGRESS',
        startDate: initialData.startDate || '',
        expectedCompletion: initialData.expectedCompletion || initialData.endDate || '',
        contractor: initialData.contractor || '',
        engineer: initialData.engineer || '',
        description: initialData.description || '',
        note: initialData.note || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'Road Construction',
        department: 'Public Works Department (PWD)',
        ward: 'Ward 1 - Sangamner Naka',
        budget: '',
        spent: '0',
        progress: 0,
        status: 'PLANNED',
        startDate: new Date().toISOString().split('T')[0],
        expectedCompletion: '',
        contractor: '',
        engineer: '',
        description: '',
        note: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.budget) {
      toast.error('Please enter project title and budget amount');
      return;
    }

    const payload = {
      ...formData,
      budget: parseFloat(formData.budget),
      spent: parseFloat(formData.spent || 0),
      progress: parseInt(formData.progress, 10) || 0
    };

    if (initialData && onSave) {
      onSave(initialData.id, payload);
      toast.success(`Project #${initialData.id} updated! AI Risk recalculated automatically.`);
    } else if (onCreate) {
      onCreate(payload);
      toast.success('New Smart City project created successfully!');
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? `Admin Update — Project #${initialData.id}` : "Register New Infrastructure Project"}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Title *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ward 4 Arterial Road Resurfacing & Drainage"
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Road Construction"
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
            <select
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="Public Works Department (PWD)">Public Works Department (PWD)</option>
              <option value="Water Supply & Sanitation">Water Supply & Sanitation</option>
              <option value="Town Planning & Industry">Town Planning & Industry</option>
              <option value="Urban Development & Irrigation">Urban Development & Irrigation</option>
              <option value="Renewable Energy & Power">Renewable Energy & Power</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ward Location</label>
            <select
              value={formData.ward}
              onChange={e => setFormData({ ...formData, ward: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="Ward 1 - Sangamner Naka">Ward 1 - Sangamner Naka</option>
              <option value="Ward 2 - Riverbank">Ward 2 - Riverbank</option>
              <option value="Ward 3 - Laxmi Nagar">Ward 3 - Laxmi Nagar</option>
              <option value="Ward 4 - Yesgaon Bypass">Ward 4 - Yesgaon Bypass</option>
              <option value="Ward 5 - MIDC Zone">Ward 5 - MIDC Zone</option>
              <option value="Ward 6 - Samvatsar Border">Ward 6 - Samvatsar Border</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Budget (INR) *</label>
            <input
              type="number"
              required
              placeholder="e.g. 5000000"
              value={formData.budget}
              onChange={e => setFormData({ ...formData, budget: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Spent Amount (INR)</label>
            <input
              type="number"
              placeholder="e.g. 3900000"
              value={formData.spent}
              onChange={e => setFormData({ ...formData, spent: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={e => setFormData({ ...formData, progress: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold text-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="PLANNED">{t('PLANNED')}</option>
              <option value="APPROVED">{t('APPROVED')}</option>
              <option value="IN_PROGRESS">{t('IN_PROGRESS')}</option>
              <option value="DELAYED">{t('DELAYED')}</option>
              <option value="COMPLETED">{t('COMPLETED')}</option>
              <option value="CANCELLED">{t('CANCELLED')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Completion Date</label>
            <input
              type="date"
              value={formData.expectedCompletion}
              onChange={e => setFormData({ ...formData, expectedCompletion: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Description & Scope</label>
          <textarea
            rows="2"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of works..."
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Admin Audit Note</label>
          <input
            type="text"
            value={formData.note}
            onChange={e => setFormData({ ...formData, note: e.target.value })}
            placeholder="e.g. Schedule revised after monsoon delay clearance."
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          />
        </div>

        <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
          ⚡ <strong>Deterministic AI Risk Engine Notice:</strong> Updating progress, status, budget, spent, or expected completion date will automatically trigger deterministic risk recalculation across all GIS maps and MCP services.
        </p>

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
            {initialData ? 'Update & Recalculate Risk' : 'Register Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
