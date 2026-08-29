import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ComplaintModal from '../components/complaints/ComplaintModal';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';
import { complaintService } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../context/LanguageContext';

const ComplaintsPage = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { t } = useTranslation();

  const fetchComplaints = () => {
    complaintService.getAll().then(setComplaints);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    await complaintService.updateStatus(id, newStatus);
    fetchComplaints();
  };

  const handleUpvote = async (id) => {
    await complaintService.upvote(id);
    toast.success('Upvoted grievance ticket!');
    fetchComplaints();
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete grievance ticket ${id}?`)) {
      await complaintService.delete(id);
      toast.success(`Grievance #${id} deleted successfully`);
      fetchComplaints();
    }
  };

  const handleLocateOnMap = (complaint) => {
    navigate('/gis');
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const pendingComplaints = filteredComplaints.filter(c => c.status === 'Pending' || c.status === 'Under Review');
  const inProgressComplaints = filteredComplaints.filter(c => c.status === 'In Progress');
  const resolvedComplaints = filteredComplaints.filter(c => c.status === 'Resolved');

  const categories = [
    { label: 'All', icon: 'list' },
    { label: 'Drainage', icon: 'water_drop' },
    { label: 'Electricity', icon: 'bolt' },
    { label: 'Garbage', icon: 'delete' },
    { label: 'Roads', icon: 'add_road' }
  ];

  const getPriorityClasses = (priority) => {
    const p = (priority || '').toUpperCase();
    if (p === 'CRITICAL') return 'bg-error-container text-on-error-container';
    if (p === 'HIGH') return 'bg-orange-100 text-orange-800';
    if (p === 'MEDIUM') return 'bg-surface-variant text-on-surface-variant';
    return 'bg-emerald-100 text-emerald-800';
  };

  const KanbanCard = ({ c, isResolved = false }) => (
    <div 
      onClick={() => {
        setActiveComplaint(c);
        setIsDetailOpen(true);
      }}
      className={`rounded-lg p-4 shadow-ambient-lvl1 hover:shadow-ambient-lvl2 border transition-all cursor-pointer group ${
        isResolved ? 'bg-surface-bright border-outline-variant/60' : 'bg-surface dark:bg-inverse-surface border-outline-variant dark:border-outline hover:border-secondary'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${getPriorityClasses(c.priority)}`}>
            {c.priority || 'Low'}
          </span>
          <span className={`text-[12px] font-medium ${isResolved ? 'text-outline line-through' : 'text-outline dark:text-outline-variant'}`}>
            #{c.id}
          </span>
        </div>
        {!isResolved && (
          <div className="flex items-center gap-1 bg-surface-container-high dark:bg-surface-container-highest px-1.5 py-0.5 rounded text-on-surface-variant dark:text-inverse-on-surface" title="AI Priority Score">
            <span className="material-symbols-outlined text-[14px] text-secondary">psychology</span>
            <span className="font-label-sm text-[11px] font-bold">{c.aiScore || Math.floor(Math.random() * 40 + 60)}</span>
          </div>
        )}
      </div>
      <h4 className={`font-body-md font-medium leading-snug mb-1 group-hover:text-primary transition-colors ${isResolved ? 'text-on-surface/80 dark:text-inverse-on-surface/80' : 'text-on-surface dark:text-inverse-on-surface'}`}>
        {c.title}
      </h4>
      {!isResolved && (
        <p className="font-body-sm text-[13px] text-on-surface-variant line-clamp-2 mb-3">
          {c.description || 'No detailed description provided by the citizen.'}
        </p>
      )}
      
      {/* Photo Thumbnail */}
      {!isResolved && ((c.photos && c.photos.length > 0) || c.photoUrl) && (
        <div className="mb-3 overflow-hidden rounded border border-outline-variant/30">
          <img 
            src={c.photos?.[0] || c.photoUrl} 
            alt="Evidence" 
            className="w-full h-24 object-cover hover:scale-105 transition-transform" 
          />
        </div>
      )}
      
      <div className={`flex justify-between items-end border-t ${isResolved ? 'border-outline-variant/30 pt-3 mt-3' : 'border-outline-variant/50 pt-3 mt-auto'}`}>
        <div className={`flex flex-col gap-1.5 ${isResolved ? 'opacity-80' : ''}`}>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            <span className="font-label-sm text-[12px]">{c.ward ? `${c.ward}, ` : ''}{c.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">
              {c.category?.toLowerCase().includes('water') || c.category?.toLowerCase().includes('drainage') ? 'water_drop' :
               c.category?.toLowerCase().includes('electric') ? 'bolt' :
               c.category?.toLowerCase().includes('garbage') ? 'delete' : 'add_road'}
            </span>
            <span className="font-label-sm text-[12px]">{c.category || 'General'}</span>
          </div>
        </div>
        {isResolved ? (
          <div className="flex items-center gap-1 text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 px-2 py-1 rounded-md">
            <span className="material-symbols-outlined text-[16px] fill-current">check_circle</span>
            <span className="font-label-sm text-[12px] font-bold">Done</span>
          </div>
        ) : (
          <div 
            className="flex items-center gap-1 text-primary bg-primary/5 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); handleUpvote(c.id); }}
          >
            <span className="material-symbols-outlined text-[16px] fill-current">thumb_up</span>
            <span className="font-label-sm text-[12px] font-bold">{c.upvotes || 0}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header & Filters Area */}
      <div className="flex flex-col gap-4 shrink-0 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-background dark:text-inverse-on-surface">Complaints Management</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Monitor, triage, and resolve citizen issues across wards.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface dark:bg-inverse-surface border border-outline-variant dark:border-outline rounded-lg font-label-md text-label-md text-on-surface dark:text-inverse-on-surface hover:bg-surface-bright dark:hover:bg-surface-variant transition-colors shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg font-label-md text-label-md text-on-primary hover:bg-primary-container transition-colors shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Ticket
            </button>
          </div>
        </div>

        {/* Filter Chips & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full">
            <span className="font-label-sm text-label-sm text-outline dark:text-outline-variant shrink-0 mr-2 uppercase tracking-wider">Category:</span>
            {categories.map(cat => (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors shadow-ambient-lvl1 cursor-pointer ${
                  selectedCategory === cat.label
                    ? 'bg-secondary-container text-on-secondary-container border border-transparent'
                    : 'bg-surface dark:bg-inverse-surface text-on-surface-variant border border-outline-variant dark:border-outline hover:border-secondary hover:text-secondary'
                }`}
              >
                {cat.icon && cat.label !== 'All' && <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>}
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative shrink-0 w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-bright dark:bg-surface-variant border border-outline-variant dark:border-outline rounded-full font-body-sm text-body-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-on-surface dark:text-inverse-on-surface transition-colors" 
              placeholder="Search complaints, wards..." 
              type="text"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-start h-full snap-x">
        
        {/* Column: Pending */}
        <div className="flex flex-col w-[320px] shrink-0 bg-surface-container dark:bg-surface-container-highest rounded-xl border border-outline-variant dark:border-outline shadow-ambient-lvl1 h-full snap-center overflow-hidden">
          <div className="p-4 border-b border-outline-variant dark:border-outline bg-surface dark:bg-inverse-surface flex justify-between items-center sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
              <h3 className="font-title-lg text-[16px] text-on-surface dark:text-inverse-on-surface font-semibold">Pending</h3>
              <span className="bg-surface-variant text-on-surface-variant font-label-sm text-[11px] px-2 py-0.5 rounded-full ml-1">{pendingComplaints.length}</span>
            </div>
            <button className="text-outline hover:text-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </div>
          <div className="p-3 flex flex-col gap-3 overflow-y-auto h-[65vh]">
            {pendingComplaints.map(c => <KanbanCard key={c.id} c={c} />)}
          </div>
        </div>

        {/* Column: In Progress */}
        <div className="flex flex-col w-[320px] shrink-0 bg-surface-container dark:bg-surface-container-highest rounded-xl border border-outline-variant dark:border-outline shadow-ambient-lvl1 h-full snap-center overflow-hidden">
          <div className="p-4 border-b border-outline-variant dark:border-outline bg-surface dark:bg-inverse-surface flex justify-between items-center sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim"></div>
              <h3 className="font-title-lg text-[16px] text-on-surface dark:text-inverse-on-surface font-semibold">In Progress</h3>
              <span className="bg-surface-variant text-on-surface-variant font-label-sm text-[11px] px-2 py-0.5 rounded-full ml-1">{inProgressComplaints.length}</span>
            </div>
            <button className="text-outline hover:text-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </div>
          <div className="p-3 flex flex-col gap-3 overflow-y-auto h-[65vh]">
            {inProgressComplaints.map(c => <KanbanCard key={c.id} c={c} />)}
          </div>
        </div>

        {/* Column: Resolved */}
        <div className="flex flex-col w-[320px] shrink-0 bg-surface-container dark:bg-surface-container-highest rounded-xl border border-outline-variant dark:border-outline shadow-ambient-lvl1 h-full snap-center overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
          <div className="p-4 border-b border-outline-variant dark:border-outline bg-surface dark:bg-inverse-surface flex justify-between items-center sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim"></div>
              <h3 className="font-title-lg text-[16px] text-on-surface dark:text-inverse-on-surface font-semibold">Resolved</h3>
              <span className="bg-surface-variant text-on-surface-variant font-label-sm text-[11px] px-2 py-0.5 rounded-full ml-1">{resolvedComplaints.length}</span>
            </div>
            <button className="text-outline hover:text-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
          <div className="p-3 flex flex-col gap-3 overflow-y-auto h-[65vh]">
            {resolvedComplaints.map(c => <KanbanCard key={c.id} c={c} isResolved={true} />)}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ComplaintModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        complaint={activeComplaint}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default ComplaintsPage;
