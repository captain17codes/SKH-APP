import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MapView from '../components/gis/MapView';
import ProjectTimeline from '../components/projects/ProjectTimeline';
import ProjectModal from '../components/projects/ProjectModal';
import { StatusBadge, DepartmentBadge, RiskBadge } from '../components/common/Badge';
import { projectService, complaintService } from '../services/api';
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

  if (loading) {
    return <Loading text="Fetching Kopargaon smart city project specifications & AI risk engine results..." />;
  }

  if (error || !project) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="p-4 rounded-full bg-error-container text-on-error-container border border-error/20">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-error">Project Not Found</span>
          <h2 className="text-2xl font-black text-on-surface">Requested Record Unavailable</h2>
          <p className="font-body-sm text-on-surface-variant max-w-md mx-auto">
            The project matching ID <span className="font-mono font-bold text-on-surface">'{id}'</span> could not be found.
          </p>
        </div>
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
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
    <div className="flex flex-col">
      {/* Page Header Section */}
      <div className="mb-section-gap">
        <div className="flex items-center gap-2 mb-2 text-on-surface-variant font-label-sm text-label-sm">
          <button onClick={() => navigate('/projects')} className="hover:text-primary transition-colors cursor-pointer">Projects</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface font-medium">{project.id}</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-background dark:text-inverse-on-surface mb-1">{project.name}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-body-sm text-body-sm text-on-surface-variant">ID: {project.id}</span>
              <StatusBadge status={project.status || 'PLANNED'} />
              <DepartmentBadge department={project.department || 'Infrastructure'} />
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 border border-outline-variant dark:border-outline rounded-lg text-on-surface-variant dark:text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-label-md cursor-pointer"
            >
              Edit Project
            </button>
            <button 
              onClick={handleDelete}
              className="px-4 py-2 border border-error text-error rounded-lg font-label-md text-label-md hover:bg-error-container hover:text-on-error-container transition-colors shadow-sm cursor-pointer"
            >
              Delete Project
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant dark:border-outline mb-6">
        <nav aria-label="Tabs" className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'risk', label: 'Risk Analysis' },
            { key: 'timeline', label: 'Timeline' },
            { key: 'complaints', label: `Complaints Nearby (${nearbyComplaints.length})` },
            { key: 'photos', label: 'Photos' },
            { key: 'documents', label: 'Documents' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`whitespace-nowrap border-b-2 py-4 px-1 font-label-md text-label-md cursor-pointer transition-colors ${
                activeTab === t.key
                  ? 'border-primary text-primary dark:text-primary-fixed'
                  : 'border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface dark:hover:text-inverse-on-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bento Grid Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Description Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface dark:bg-inverse-surface rounded-xl shadow-ambient-lvl1 p-6 border border-outline-variant dark:border-outline">
              <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface mb-4">Project Overview</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4 leading-relaxed">
                {project.description || 'No detailed scope description provided.'}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-outline-variant dark:border-outline">
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Category</span>
                  <span className="block font-body-sm text-body-sm font-medium text-on-surface dark:text-inverse-on-surface">{project.category || 'General'}</span>
                </div>
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Start Date</span>
                  <span className="block font-body-sm text-body-sm font-medium text-on-surface dark:text-inverse-on-surface">{startFormatted}</span>
                </div>
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Est. Completion</span>
                  <span className="block font-body-sm text-body-sm font-medium text-on-surface dark:text-inverse-on-surface">{completionFormatted}</span>
                </div>
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Nodal Officer</span>
                  <span className="block font-body-sm text-body-sm font-medium text-on-surface dark:text-inverse-on-surface">{project.officer || 'Unassigned'}</span>
                </div>
              </div>
            </div>

            {/* Budget Card */}
            <div className="bg-surface dark:bg-inverse-surface rounded-xl shadow-ambient-lvl1 p-6 border border-outline-variant dark:border-outline">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Financial Progress</h3>
                <button className="text-primary font-label-md text-label-md hover:underline cursor-pointer">View Detailed Ledger</button>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 w-full">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-label-md text-on-surface-variant">Spent: {spentFormatted}</span>
                    <span className="font-label-md font-medium text-on-surface dark:text-inverse-on-surface">Budget: {budgetFormatted}</span>
                  </div>
                  <div className="w-full bg-surface-variant rounded-full h-3 mb-2 overflow-hidden">
                    <div className="bg-secondary h-3 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (project.spent / project.budget) * 100))}%` }}></div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-right">
                    {project.budget > 0 ? ((project.spent / project.budget) * 100).toFixed(0) : 0}% Utilized
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto min-w-[200px]">
                  <div className="p-3 bg-surface-container-low dark:bg-surface-container-highest rounded-lg">
                    <span className="block font-label-sm text-label-sm text-secondary mb-1">Physical Progress</span>
                    <span className="block font-headline-md text-headline-md text-on-surface dark:text-inverse-on-surface">{project.progress || 0}%</span>
                  </div>
                  <div className="p-3 bg-surface-bright dark:bg-surface-variant border border-outline-variant dark:border-outline rounded-lg">
                    <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Expected Progress</span>
                    <span className="block font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">{metrics.expectedProgress || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            {/* Location Thumbnail */}
            <div className="bg-surface dark:bg-inverse-surface rounded-xl shadow-ambient-lvl1 border border-outline-variant dark:border-outline overflow-hidden">
              <div className="h-48 w-full relative bg-surface-variant">
                <MapView center={project.coordinates || [19.8917, 74.4789]} zoom={15} showAllControls={false} height="h-full" />
                <div className="absolute top-2 right-2">
                  <Link to={mapUrl} className="p-2 bg-surface rounded-full shadow-md flex items-center justify-center text-on-surface hover:bg-surface-container-lowest transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </Link>
                </div>
              </div>
              <div className="p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary mt-0.5" data-icon="location_on" data-weight="fill">location_on</span>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface dark:text-inverse-on-surface">{project.ward}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Kopargaon Municipality</p>
                </div>
              </div>
            </div>

            {/* Quick Risk Summary */}
            <div className="bg-surface dark:bg-inverse-surface rounded-xl shadow-ambient-lvl1 p-5 border border-outline-variant dark:border-outline">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error" data-icon="warning">warning</span>
                  Risk Score
                </h3>
              </div>
              <div className="flex items-end gap-4 mb-4">
                <div className={`text-4xl font-display-md ${riskAnalysis.risk === 'HIGH' || riskAnalysis.risk === 'CRITICAL' ? 'text-error' : riskAnalysis.risk === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {riskAnalysis.score || 0}
                </div>
                <div className="pb-1">
                  <div className="mb-1">
                    <RiskBadge risk={riskAnalysis.risk} />
                  </div>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant">/ 100 max</span>
                </div>
              </div>
              <p className={`font-body-sm text-body-sm text-on-surface-variant mb-4 border-l-2 pl-3 ${riskAnalysis.risk === 'HIGH' || riskAnalysis.risk === 'CRITICAL' ? 'border-error' : riskAnalysis.risk === 'MEDIUM' ? 'border-amber-500' : 'border-emerald-500'}`}>
                {riskAnalysis.reasons[0] || 'Project risk evaluated based on schedule variance and budget expenditure.'}
              </p>
              <button 
                onClick={() => setActiveTab('risk')}
                className="w-full py-2 border border-outline-variant dark:border-outline rounded-lg text-on-surface-variant dark:text-inverse-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                View Full Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. AI RISK ENGINE ANALYSIS TAB */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface dark:bg-inverse-surface border border-outline-variant dark:border-outline rounded-xl p-5 shadow-ambient-lvl1 space-y-3 text-center">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Computed AI Risk Score</span>
              <div className="text-4xl font-display-md text-on-surface dark:text-inverse-on-surface">{riskAnalysis.score}/100</div>
              <div className="flex justify-center">
                <RiskBadge risk={riskAnalysis.risk} />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-2">
                Deterministic calculation based on timeline elapsed %, budget spent ratio, PostGIS complaint proximity, and ward infrastructure load.
              </p>
            </div>

            <div className="md:col-span-2 bg-surface dark:bg-inverse-surface border border-outline-variant dark:border-outline rounded-xl p-5 shadow-ambient-lvl1 space-y-3">
              <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Key Risk Factors Identified</h3>
              <ul className="space-y-2">
                {riskAnalysis.reasons.map((r, i) => (
                  <li key={i} className="flex items-start space-x-2 p-3 bg-surface-container-low dark:bg-surface-container-highest rounded-lg">
                    <span className="material-symbols-outlined text-error text-sm mt-0.5">error</span>
                    <span className="font-body-md text-on-surface dark:text-inverse-on-surface">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Recommended Actions */}
          <div className="bg-surface dark:bg-inverse-surface border border-outline-variant dark:border-outline rounded-xl p-5 shadow-ambient-lvl1 space-y-4">
            <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface flex items-center">
              <span className="material-symbols-outlined text-emerald-500 mr-2">check_circle</span>
              Recommended Municipal Actions (Decision Support)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {riskAnalysis.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-primary-container/10 border border-primary-container/30 rounded-lg text-on-primary-container dark:text-primary-fixed font-body-md font-medium">
                  {rec}
                </div>
              ))}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant italic pt-2">
              * Recommendations are decision-support guidelines for municipal leaders and do not automatically modify project records.
            </p>
          </div>
        </div>
      )}

      {/* 3. TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <div className="bg-surface dark:bg-inverse-surface border border-outline-variant dark:border-outline rounded-xl p-6 max-w-2xl shadow-ambient-lvl1">
          <ProjectTimeline timeline={project.timeline || [
            { date: startFormatted, title: "Project Approved & Initialized", status: "completed" },
            { date: "Current Date", title: `Execution Progress: ${project.progress}%`, status: "in-progress" },
            { date: completionFormatted, title: "Target Completion Date", status: "pending" }
          ]} />
        </div>
      )}

      {/* 4. NEARBY COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="bg-surface dark:bg-inverse-surface border border-outline-variant dark:border-outline rounded-xl p-5 space-y-4 shadow-ambient-lvl1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">
              Citizen Grievances Near Project Corridor
            </h3>
            <span className="px-3 py-1 bg-surface-container-high rounded-full font-label-sm text-label-sm text-on-surface">
              {nearbyComplaints.length} Total Nearby
            </span>
          </div>

          {nearbyComplaints.length === 0 ? (
            <p className="text-on-surface-variant py-4 text-center font-body-md">No active citizen grievances reported near this project location.</p>
          ) : (
            <div className="space-y-3">
              {nearbyComplaints.map(c => (
                <div key={c.id} className="p-4 bg-surface-container-lowest dark:bg-surface-variant rounded-lg border border-outline-variant dark:border-outline flex items-center justify-between">
                  <div>
                    <span className="font-label-md text-label-md text-on-surface dark:text-inverse-on-surface block mb-1">{c.title}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">ID: {c.id} • Category: {c.category}</span>
                  </div>
                  <StatusBadge status={c.status} />
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
            <div key={idx} className="bg-surface-variant rounded-xl h-48 overflow-hidden relative group border border-outline-variant dark:border-outline">
              <img
                src={`https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=400&auto=format&fit=crop&q=80`}
                alt="Site progress inspection"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 p-3 flex items-end">
                <span className="font-label-sm text-label-sm text-white">Site Inspection #{idx}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="bg-surface dark:bg-inverse-surface border border-outline-variant dark:border-outline rounded-xl p-5 space-y-4 shadow-ambient-lvl1">
          <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface">Attached Engineering & DPR Files</h3>
          <div className="space-y-3">
            {['Detailed_Project_Report_DPR.pdf', 'Environmental_Clearance_Certificate.pdf', 'Structural_Load_Calculations.dwg'].map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface-container-lowest dark:bg-surface-variant rounded-lg border border-outline-variant dark:border-outline">
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-secondary">description</span>
                  <span className="font-label-md text-label-md text-on-surface dark:text-inverse-on-surface">{doc}</span>
                </div>
                <button onClick={() => toast.success(`Downloading ${doc}...`)} className="text-primary font-label-md text-label-md hover:underline cursor-pointer">Download</button>
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
