import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import ProjectTable from '../components/projects/ProjectTable';
import ProjectModal from '../components/projects/ProjectModal';
import NewComplaintModal from '../components/complaints/NewComplaintModal';
import ComplaintModal from '../components/complaints/ComplaintModal';
import { projectService, complaintService } from '../services/api';
import { StatusBadge } from '../components/common/Badge';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isComplaintDetailOpen, setIsComplaintDetailOpen] = useState(false);

  useEffect(() => {
    projectService.getAll().then(setProjects);
    complaintService.getAll().then(setComplaints);
  }, []);

  const totalProjects = projects.length;
  const ongoingProjects = projects.filter(p => (p.status || '').toUpperCase() === 'IN_PROGRESS' || (p.status || '').toUpperCase() === 'ONGOING' || (p.status || '').toUpperCase() === 'APPROVED').length;
  const delayedProjects = projects.filter(p => (p.status || '').toUpperCase() === 'DELAYED').length;
  const criticalRiskCount = projects.filter(p => (p.aiRisk || p.riskAnalysis?.risk || '').toUpperCase() === 'CRITICAL').length;

  const tooltipStyle = theme === 'dark'
    ? { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }
    : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', color: '#0f172a', fontSize: '12px' };

  // Recharts Chart Datasets
  const progressChartData = projects.map(p => ({
    name: p.name.split(' ').slice(0, 3).join(' '),
    progress: p.progress
  }));

  const wardDevelopmentData = [
    { ward: 'Ward 1', progress: 78, budgetCr: 8.2 },
    { ward: 'Ward 2', progress: 85, budgetCr: 4.5 },
    { ward: 'Ward 3', progress: 64, budgetCr: 3.6 },
    { ward: 'Ward 4', progress: 90, budgetCr: 9.5 },
    { ward: 'Ward 5', progress: 72, budgetCr: 5.4 },
    { ward: 'Ward 6', progress: 81, budgetCr: 2.8 }
  ];

  const handleUpdateComplaintStatus = async (id, status) => {
    const updated = await complaintService.updateStatus(id, status);
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface dark:text-inverse-on-surface">Dashboard Overview</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Real-time civic data and project tracking for Kopargaon.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface dark:bg-inverse-surface border border-outline-variant dark:border-outline text-primary dark:text-primary-fixed-dim font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Report
          </button>
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Project
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-surface dark:bg-inverse-surface p-5 rounded-xl shadow-ambient-lvl1 flex items-center gap-4 border border-outline-variant dark:border-outline hover:shadow-ambient-lvl2 transition-shadow cursor-pointer" onClick={() => navigate('/projects')}>
          <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary">foundation</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Projects</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display-md text-display-md text-on-surface dark:text-inverse-on-surface">{totalProjects}</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface dark:bg-inverse-surface p-5 rounded-xl shadow-ambient-lvl1 flex items-center gap-4 border border-outline-variant dark:border-outline hover:shadow-ambient-lvl2 transition-shadow cursor-pointer" onClick={() => navigate('/projects?status=IN_PROGRESS')}>
          <div className="w-12 h-12 rounded-lg bg-secondary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary">construction</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Ongoing</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display-md text-display-md text-on-surface dark:text-inverse-on-surface">{ongoingProjects}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center">Active Sites</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface dark:bg-inverse-surface p-5 rounded-xl shadow-ambient-lvl1 flex items-center gap-4 border border-error-container relative overflow-hidden hover:shadow-ambient-lvl2 transition-shadow cursor-pointer" onClick={() => navigate('/projects?status=DELAYED')}>
          <div className="absolute right-0 top-0 w-16 h-16 bg-error-container rounded-bl-full opacity-50"></div>
          <div className="w-12 h-12 rounded-lg bg-error-container flex items-center justify-center shrink-0 z-10">
            <span className="material-symbols-outlined text-error">warning</span>
          </div>
          <div className="z-10">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Delayed/Critical</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display-md text-display-md text-error">{delayedProjects + criticalRiskCount}</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface dark:bg-inverse-surface p-5 rounded-xl shadow-ambient-lvl1 flex items-center gap-4 border border-outline-variant dark:border-outline hover:shadow-ambient-lvl2 transition-shadow cursor-pointer" onClick={() => navigate('/complaints')}>
          <div className="w-12 h-12 rounded-lg bg-surface-variant dark:bg-surface-container-highest flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant">forum</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Complaints</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display-md text-display-md text-on-surface dark:text-inverse-on-surface">{complaints.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Bar Chart Card */}
          <div className="bg-surface dark:bg-inverse-surface rounded-xl shadow-ambient-lvl1 p-6 h-80 flex flex-col border border-outline-variant dark:border-outline">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface font-semibold">Projects by Ward</h3>
              <button onClick={() => navigate('/gis')} className="text-primary dark:text-primary-fixed-dim font-label-md text-label-md hover:underline">View on Map</button>
            </div>
            <div className="flex-1 relative pb-2 pt-2 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardDevelopmentData}>
                  <XAxis dataKey="ward" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={11} />
                  <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="progress" name="Progress (%)" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budgetCr" name="Budget (₹ Cr)" fill="#57dffe" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Area Chart Card */}
          <div className="bg-surface dark:bg-inverse-surface rounded-xl shadow-ambient-lvl1 p-6 h-72 flex flex-col border border-outline-variant dark:border-outline">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface font-semibold">Infrastructure Progress</h3>
              <button onClick={() => navigate('/analytics')} className="text-primary dark:text-primary-fixed-dim font-label-md text-label-md hover:underline">Full Analytics</button>
            </div>
            <div className="flex-1 w-full h-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressChartData}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={10} tickLine={false} />
                  <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="progress" stroke="#1e3a8a" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: AI-Flagged Risks (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-surface dark:bg-inverse-surface rounded-xl shadow-ambient-lvl1 p-6 h-full border border-error-container">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-error">psychology</span>
              <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface font-semibold">AI-Flagged Risks</h3>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[40rem] pr-2">
              {projects.filter(p => (p.aiRisk || p.riskAnalysis?.risk || '').toUpperCase() === 'CRITICAL' || (p.aiRisk || p.riskAnalysis?.risk || '').toUpperCase() === 'HIGH').slice(0, 5).map(p => (
                <div key={p.id} className="p-4 rounded-lg border border-outline-variant dark:border-outline bg-surface-bright dark:bg-slate-900 flex flex-col gap-2 shadow-sm card-hover">
                  <div className="flex justify-between items-start">
                    <h4 className="font-label-md text-label-md font-semibold text-on-surface dark:text-inverse-on-surface line-clamp-1">{p.name}</h4>
                    <span className={`px-2 py-1 font-label-sm text-[10px] uppercase rounded-full font-bold tracking-wider shrink-0 ml-2 ${
                      (p.aiRisk || p.riskAnalysis?.risk) === 'CRITICAL' ? 'bg-error-container text-on-error-container' : 'bg-surface-variant text-on-surface-variant dark:bg-surface-container-highest'
                    }`}>
                      {p.aiRisk || p.riskAnalysis?.risk || 'High Risk'}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-on-surface-variant line-clamp-2">
                    {p.riskAnalysis?.reasons?.[0] || 'AI detected potential schedule or budget variance.'}
                  </p>
                  <button onClick={() => navigate(`/projects/${p.id}`)} className="text-primary dark:text-primary-fixed-dim font-label-sm text-label-sm hover:underline self-start mt-1">Review Project</button>
                </div>
              ))}
              {projects.filter(p => (p.aiRisk || p.riskAnalysis?.risk || '').toUpperCase() === 'CRITICAL' || (p.aiRisk || p.riskAnalysis?.risk || '').toUpperCase() === 'HIGH').length === 0 && (
                <div className="text-center p-8 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle</span>
                  <p className="font-label-md text-label-md">No critical AI risks detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Projects & Complaints Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity Timeline (Using Projects) */}
        <div className="lg:col-span-2 bg-surface dark:bg-inverse-surface rounded-xl shadow-ambient-lvl1 p-6 border border-outline-variant dark:border-outline">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface font-semibold">Recent Projects</h3>
            <button onClick={() => navigate('/projects')} className="text-primary dark:text-primary-fixed-dim font-label-md text-label-md hover:underline">View All</button>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-outline-variant dark:border-outline">
            <ProjectTable projects={projects.slice(0, 5)} />
          </div>
        </div>

        {/* Recent Complaints (Timeline style from mockup) */}
        <div className="lg:col-span-1 bg-surface dark:bg-inverse-surface rounded-xl shadow-ambient-lvl1 p-6 border border-outline-variant dark:border-outline">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-title-lg text-title-lg text-on-surface dark:text-inverse-on-surface font-semibold">Recent Grievances</h3>
            <button onClick={() => navigate('/complaints')} className="text-primary dark:text-primary-fixed-dim font-label-md text-label-md hover:underline">View All</button>
          </div>
          
          <div className="flex flex-col border-l-2 border-outline-variant dark:border-outline ml-4 mt-2">
            {complaints.slice(0, 4).map((c, i) => {
              const dotColors = ['bg-tertiary-fixed-dim', 'bg-secondary', 'bg-error', 'bg-primary-fixed-dim'];
              const dotColor = dotColors[i % dotColors.length];
              
              return (
                <div key={c.id} className="relative pl-6 pb-6 last:pb-0 cursor-pointer group" onClick={() => { setSelectedComplaint(c); setIsComplaintDetailOpen(true); }}>
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${dotColor} border-2 border-surface dark:border-inverse-surface group-hover:scale-125 transition-transform`}></div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{c.reportedDate}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="font-body-md text-body-md text-on-surface dark:text-inverse-on-surface group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors mt-1">
                    <strong>{c.category}:</strong> {c.title}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{c.ward}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreate={(p) => {
          projectService.create(p).then(() => {
            projectService.getAll().then(setProjects);
          });
        }}
      />

      <NewComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        onSubmit={(c) => {
          complaintService.create(c).then(() => {
            complaintService.getAll().then(setComplaints);
          });
        }}
      />

      <ComplaintModal
        isOpen={isComplaintDetailOpen}
        onClose={() => setIsComplaintDetailOpen(false)}
        complaint={selectedComplaint}
        onUpdateStatus={handleUpdateComplaintStatus}
      />
    </div>
  );
};

export default DashboardPage;
