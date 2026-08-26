import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  MapPin,
  Calendar,
  User,
  Building,
  FileText,
  Camera,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  AlertCircle,
  Compass,
  Activity,
  Home,
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  MessageSquareWarning
} from 'lucide-react';
import MapView from '../components/gis/MapView';
import ProjectTimeline from '../components/projects/ProjectTimeline';
import ProjectModal from '../components/projects/ProjectModal';
import { StatusBadge, DepartmentBadge, RiskBadge } from '../components/common/Badge';
import { projectService, complaintService, milestoneService } from '../services/api';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';

const formatMoney = (amount) => {
  const num = Number(amount || 0);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(0)} Lakh`;
  return `₹${num.toLocaleString()}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'TBD';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'risk' | 'timeline' | 'complaints' | 'photos' | 'documents'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [nearbyComplaints, setNearbyComplaints] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState({ name: '', target_date: '' });

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await projectService.getById(id);
      setProject(res || null);

      if (res) {
        const allCmp = await complaintService.getAll();
        const prjWard = res.ward ? res.ward.toLowerCase() : '';
        const matching = allCmp.filter(c => {
          if (c.ward && prjWard && prjWard.includes(c.ward.toLowerCase())) return true;
          return false;
        });
        setNearbyComplaints(matching);

        // Fetch milestones
        try {
          const mList = await milestoneService.getByProject(id);
          setMilestones(mList);
        } catch(e) {
          console.error("Failed to load milestones:", e);
        }
      }
    } catch {
      setError(true);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    } else {
      setLoading(false);
      setProject(null);
    }
  }, [id]);

  const handleSaveEdit = async (projectId, updatedFields) => {
    await projectService.update(projectId, updatedFields);
    fetchProjectDetails();
  };

  const handleDelete = async () => {
    if (!project) return;
    if (window.confirm(`Are you sure you want to delete project ${id}?`)) {
      await projectService.delete(id);
      toast.success(`Project #${id} deleted successfully`);
      navigate('/projects');
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.name || !newMilestone.target_date) {
      toast.error('Name and target date are required');
      return;
    }
    try {
      await milestoneService.create(id, newMilestone);
      toast.success('Milestone added successfully');
      setNewMilestone({ name: '', target_date: '' });
      // Refresh milestones
      const mList = await milestoneService.getByProject(id);
      setMilestones(mList);
    } catch(e) {
      toast.error('Failed to add milestone');
    }
  };

  if (loading) {
    return <Loading text="Fetching Kopargaon smart city project specifications & AI risk engine results..." />;
  }

  if (error || !project) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Project Not Found</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Requested Record Unavailable</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            The project matching ID <span className="font-mono font-bold text-slate-700 dark:text-slate-200">'{id}'</span> could not be found.
          </p>
        </div>
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </button>
        </div>
      </div>
    );
  }

  const riskAnalysis = project.riskAnalysis || {
    risk: project.aiRisk || 'UNKNOWN',
    score: project.riskScore || 0,
    reasons: ["Data analysis in progress."],
    metrics: { expectedProgress: project.progress || 0, actualProgress: project.progress || 0, progressGap: 0, budgetUtilization: 0 },
    recommendations: ["Review schedule and budget."]
  };

  const metrics = riskAnalysis.metrics || {};
  const budgetFormatted = formatMoney(project.budget);
  const spentFormatted = formatMoney(project.spent);
  const startFormatted = formatDate(project.startDate);
  const completionFormatted = formatDate(project.expectedCompletion || project.endDate);

  const mapUrl = project.coordinates && Array.isArray(project.coordinates)
    ? `/gis?lat=${project.coordinates[0]}&lng=${project.coordinates[1]}&project=${project.id}`
    : `/gis?project=${project.id}`;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Projects Directory
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={mapUrl}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>View on GIS Map</span>
          </Link>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Admin Update</span>
          </button>

          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 font-mono">
              {project.id}
            </span>
            <DepartmentBadge department={project.department || 'Infrastructure'} />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
              {project.category || 'General'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <StatusBadge status={project.status || 'PLANNED'} />
            <RiskBadge risk={riskAnalysis.risk} score={riskAnalysis.score} />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{project.name}</h1>

        {/* Location & Dates row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center font-medium"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {project.ward}</span>
          <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Start: {startFormatted}</span>
          <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Target Completion: {completionFormatted}</span>
        </div>
      </div>

      {/* AI Risk Engine Summary Alert Banner */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        riskAnalysis.risk === 'CRITICAL' ? 'bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-200' :
        riskAnalysis.risk === 'HIGH' ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200' :
        riskAnalysis.risk === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' :
        'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
      }`}>
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm uppercase">AI Risk Engine Assessment: {riskAnalysis.risk}</span>
              <span className="text-xs px-2 py-0.5 rounded font-bold bg-white/60 dark:bg-slate-900/60">
                Score: {riskAnalysis.score}/100
              </span>
            </div>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {riskAnalysis.reasons[0] || 'Project risk evaluated based on schedule variance, budget expenditure, and spatial grievances.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('risk')}
          className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 text-xs font-bold shadow-xs hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
        >
          View Full AI Analysis →
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Budget</span>
          <span className="text-lg font-black text-slate-900 dark:text-slate-100">{budgetFormatted}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Spent to Date</span>
          <span className="text-lg font-black text-blue-600 dark:text-blue-400">{spentFormatted}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Utilization: {metrics.budgetUtilization || 0}%</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Physical Progress</span>
          <span className="text-lg font-black text-slate-900 dark:text-slate-100">{project.progress}%</span>
          <span className={`text-[10px] font-bold block mt-0.5 ${metrics.progressGap < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            Expected: {metrics.expectedProgress || 0}% (Gap: {metrics.progressGap || 0}%)
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Nearby Grievances</span>
          <span className="text-lg font-black text-amber-600 dark:text-amber-400">{nearbyComplaints.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">PostGIS 1km Buffer</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-bold overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'risk', label: 'AI Risk Engine Analysis' },
          { key: 'timeline', label: 'Timeline & Milestones' },
          { key: 'complaints', label: `Nearby Complaints (${nearbyComplaints.length})` },
          { key: 'photos', label: 'Photos' },
          { key: 'documents', label: 'Documents' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-3 uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 text-xs shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Project Description & Scope</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {project.description || 'No detailed scope description provided.'}
              </p>
            </div>

            {/* Progress vs Timeline Analysis Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 text-xs shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Execution Progress vs. Expected Timeline</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Reported Physical Progress</span>
                  <span className="text-blue-600 dark:text-blue-400">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Expected Timeline Progress (Elapsed)</span>
                  <span className="text-amber-600 dark:text-amber-400">{metrics.expectedProgress || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div className="bg-amber-500 h-3 rounded-full" style={{ width: `${metrics.expectedProgress || 0}%` }} />
                </div>
              </div>

              {metrics.progressGap !== undefined && (
                <p className={`text-xs font-semibold p-2.5 rounded-lg ${metrics.progressGap < 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                  {metrics.progressGap < 0
                    ? `⚠️ Progress is currently ${Math.abs(metrics.progressGap)}% behind expected schedule target.`
                    : `✓ Progress is operating on schedule (Variance: +${metrics.progressGap}%).`}
                </p>
              )}
            </div>
          </div>

          {/* Right GIS Map Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">GIS Location</h3>
              <Link to={mapUrl} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Open Smart Map →
              </Link>
            </div>
            <MapView center={project.coordinates || [19.8917, 74.4789]} zoom={15} showAllControls={false} height="h-72" />
          </div>
        </div>
      )}

      {/* 2. AI RISK ENGINE ANALYSIS TAB */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3 text-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Computed AI Risk Score</span>
              <div className="text-4xl font-black text-slate-900 dark:text-slate-100">{riskAnalysis.score}/100</div>
              <div className="flex justify-center">
                <RiskBadge risk={riskAnalysis.risk} score={riskAnalysis.score} />
              </div>
              <p className="text-[11px] text-slate-500 pt-2">
                Deterministic calculation based on timeline elapsed %, budget spent ratio, PostGIS complaint proximity, and ward infrastructure load.
              </p>
            </div>

            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Key Risk Factors Identified</h3>
              <ul className="space-y-2 text-xs">
                {riskAnalysis.reasons.map((r, i) => (
                  <li key={i} className="flex items-start space-x-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <span className="text-rose-500 font-bold">•</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Recommended Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
              Recommended Municipal Actions (Decision Support)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {riskAnalysis.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-900 dark:text-blue-200 font-semibold">
                  ✓ {rec}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 italic pt-1">
              * Recommendations are decision-support guidelines for municipal leaders and do not automatically modify project records.
            </p>
          </div>
        </div>
      )}

      {/* 3. TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-sm">Project Milestones</h3>
            {milestones.length > 0 ? (
              <ProjectTimeline timeline={milestones.map(m => ({
                title: m.name,
                date: formatDate(m.target_date),
                status: m.status === 'COMPLETED' ? 'completed' : m.status === 'IN_PROGRESS' ? 'in-progress' : 'pending'
              }))} />
            ) : (
              <div className="text-slate-500 text-xs italic">No milestones defined yet. Add one to track progress.</div>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Add New Milestone</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Milestone Name</label>
                <input 
                  type="text" 
                  value={newMilestone.name}
                  onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm" 
                  placeholder="e.g., Land Acquisition Complete"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Date</label>
                <input 
                  type="date" 
                  value={newMilestone.target_date}
                  onChange={(e) => setNewMilestone({...newMilestone, target_date: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm" 
                />
              </div>
              <button
                onClick={handleAddMilestone}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow transition-colors text-xs"
              >
                Save Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. NEARBY COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Citizen Grievances Near Project Corridor (PostGIS Match)
            </h3>
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-full font-bold">
              {nearbyComplaints.length} Total Nearby
            </span>
          </div>

          {nearbyComplaints.length === 0 ? (
            <p className="text-slate-500 py-4 text-center">No active citizen grievances reported near this project location.</p>
          ) : (
            <div className="space-y-2">
              {nearbyComplaints.map(c => (
                <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{c.title}</span>
                    <span className="text-[11px] text-slate-500">ID: {c.id} · Category: {c.category} · Priority: {c.priority}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. PHOTOS TAB */}
      {activeTab === 'photos' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="bg-slate-800 rounded-xl h-44 overflow-hidden relative group border border-slate-700">
              <img
                src={`https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=400&auto=format&fit=crop&q=80`}
                alt="Site progress inspection"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/40 p-3 flex items-end">
                <span className="text-[10px] font-bold text-white">Site Inspection Photo #{idx}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 text-xs shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Attached Engineering & DPR Files</h3>
          <div className="space-y-2">
            {['Detailed_Project_Report_DPR.pdf', 'Environmental_Clearance_Certificate.pdf', 'Structural_Load_Calculations.dwg'].map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{doc}</span>
                </div>
                <button onClick={() => toast.success(`Downloading ${doc}...`)} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer">Download</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={project}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default ProjectDetailsPage;
