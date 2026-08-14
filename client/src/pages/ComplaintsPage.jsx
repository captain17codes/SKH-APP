import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareWarning, Plus, LayoutGrid, ListFilter, AlertCircle, CheckCircle2, Clock, Cpu, BarChart3, TrendingUp } from 'lucide-react';
import ComplaintCard from '../components/complaints/ComplaintCard';
import ComplaintTable from '../components/complaints/ComplaintTable';
import ComplaintModal from '../components/complaints/ComplaintModal';
import NewComplaintModal from '../components/complaints/NewComplaintModal';
import StatCard from '../components/common/StatCard';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';
import EmptyState from '../components/common/EmptyState';
import { complaintService } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../context/LanguageContext';


const ComplaintsPage = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLodgeOpen, setIsLodgeOpen] = useState(false);
  const { t } = useTranslation();

  const fetchComplaints = () => {
    complaintService.getAll().then(setComplaints);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Pending' || c.status === 'Under Review').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  const filterConfigs = [
    {
      key: 'category',
      label: t('filterCategory'),
      options: ['Road Damage', 'Water Leakage', 'Garbage', 'Street Light', 'Drainage', 'Illegal Construction', 'Traffic', 'Electricity', 'Public Infrastructure', 'Other']
    },
    {
      key: 'status',
      label: t('filterStatus'),
      options: ['Pending', 'Under Review', 'In Progress', 'Resolved']
    },
    {
      key: 'priority',
      label: t('filterPriority'),
      options: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    }
  ];


  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedFilters.category || c.category === selectedFilters.category;
    const matchesStatus = !selectedFilters.status || c.status === selectedFilters.status;
    const matchesPriority = !selectedFilters.priority || 
      (c.priority && (c.priority.toUpperCase() === selectedFilters.priority.toUpperCase()));

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });


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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <MessageSquareWarning className="w-5 h-5 text-amber-500 mr-2" />
            {t('grievancePortalTitle')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('grievancePortalDesc')}
          </p>
        </div>

        <button
          onClick={() => setIsLodgeOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5 w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('lodgeNewGrievance')}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title={t('totalRegistered')}
          value={totalComplaints}
          subtitle={t('totalRegisteredDesc')}
          icon={MessageSquareWarning}
          color="amber"
        />
        <StatCard
          title={t('pendingReview')}
          value={pendingCount}
          subtitle={t('pendingReviewDesc')}
          icon={AlertCircle}
          color="rose"
        />
        <StatCard
          title={t('inWorkPipeline')}
          value={inProgressCount}
          subtitle={t('inWorkPipelineDesc')}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title={t('resolvedTicketsTitle')}
          value={resolvedCount}
          subtitle={t('resolvedTicketsDesc')}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* AI Priority Engine Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('aiPriorityEngineTitle')}</span>
          <span className="ml-auto text-[10px] text-slate-400 italic">{t('aiPriorityEngineDesc')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('priorityCritical'), key: 'CRITICAL', color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', light: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800', icon: '🚨' },
            { label: t('priorityHigh'), key: 'HIGH', color: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400', light: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', icon: '🔴' },
            { label: t('priorityMedium'), key: 'MEDIUM', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', light: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', icon: '🟡' },
            { label: t('priorityLow'), key: 'LOW', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', light: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', icon: '🟢' }
          ].map(({ label, key, color, textColor, light, icon }) => {
            const count = complaints.filter(c =>
              (c.priority === key || c.priority === label || c.priority?.toUpperCase() === key) &&
              c.status !== 'Resolved'
            ).length;
            const pct = complaints.length > 0 ? Math.round((count / Math.max(complaints.filter(c => c.status !== 'Resolved').length, 1)) * 100) : 0;
            return (
              <div key={key} className={`rounded-xl border p-3 ${light}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{icon} {label}</span>
                  <span className={`text-base font-black ${textColor}`}>{count}</span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <p className={`text-[10px] mt-1 ${textColor} font-semibold`}>{pct}{t('pctOpenTickets')}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('searchComplaintsPlaceholder')}
            className="w-full sm:w-72"
          />

          <FilterPanel
            filters={filterConfigs}
            selectedFilters={selectedFilters}
            onFilterChange={(k, v) => setSelectedFilters(prev => ({ ...prev, [k]: v }))}
            onReset={() => setSelectedFilters({})}
          />
        </div>

        <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors ${
              viewMode === 'grid' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{t('grid')}</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors ${
              viewMode === 'table' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>{t('table')}</span>
          </button>
        </div>
      </div>

      {/* Cards or Table */}
      {filteredComplaints.length === 0 ? (
        <EmptyState
          title={t('noRecordsFound')}
          description={t('noRecordsDesc')}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.map(c => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              onViewDetails={(comp) => {
                setActiveComplaint(comp);
                setIsDetailOpen(true);
              }}
              onLocateOnMap={handleLocateOnMap}
              onUpvote={handleUpvote}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <ComplaintTable
          complaints={filteredComplaints}
          onViewDetails={(comp) => {
            setActiveComplaint(comp);
            setIsDetailOpen(true);
          }}
          onLocateOnMap={handleLocateOnMap}
          onUpvote={handleUpvote}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <ComplaintModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        complaint={activeComplaint}
        onUpdateStatus={handleUpdateStatus}
      />

      <NewComplaintModal
        isOpen={isLodgeOpen}
        onClose={() => setIsLodgeOpen(false)}
        onSubmit={async (newC) => {
          await complaintService.create(newC);
          fetchComplaints();
        }}
      />
    </div>
  );
};

export default ComplaintsPage;
