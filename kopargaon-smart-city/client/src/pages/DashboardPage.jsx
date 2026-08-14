import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  MessageSquareWarning,
  Plus,
  ArrowRight,
  Eye,
  Bot
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import StatCard from '../components/common/StatCard';
import ChartCard from '../components/common/ChartCard';
import ProjectTable from '../components/projects/ProjectTable';
import ProjectModal from '../components/projects/ProjectModal';
import NewComplaintModal from '../components/complaints/NewComplaintModal';
import ComplaintModal from '../components/complaints/ComplaintModal';
import { projectService, complaintService } from '../services/api';
import { StatusBadge } from '../components/common/Badge';
import { useTheme } from '../context/ThemeContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
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
  const completedProjects = projects.filter(p => (p.status || '').toUpperCase() === 'COMPLETED').length;
  const delayedProjects = projects.filter(p => (p.status || '').toUpperCase() === 'DELAYED').length;
  const highRiskCount = projects.filter(p => (p.aiRisk || p.riskAnalysis?.risk || '').toUpperCase() === 'HIGH').length;
  const criticalRiskCount = projects.filter(p => (p.aiRisk || p.riskAnalysis?.risk || '').toUpperCase() === 'CRITICAL').length;

  const totalBudget = projects.reduce((acc, curr) => acc + (curr.budget || 0), 0);
  const totalSpent = projects.reduce((acc, curr) => acc + (curr.spent || 0), 0);

  const tooltipStyle = theme === 'dark'
    ? { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }
    : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', color: '#0f172a', fontSize: '12px' };

  // Recharts Chart Datasets
  const progressChartData = projects.map(p => ({
    name: p.name.split(' ').slice(0, 3).join(' '),
    progress: p.progress
  }));

  const budgetPieData = [
    { name: 'Spent (INR)', value: totalSpent, color: '#3b82f6' },
    { name: 'Remaining (INR)', value: Math.max(0, totalBudget - totalSpent), color: '#10b981' }
  ];

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
    <div className="space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Executive Overview</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Kopargaon Smart City Master Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1">Real-time GIS analytics, AI project monitoring & ward development metrics.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>

          <button
            onClick={() => setIsComplaintModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <MessageSquareWarning className="w-4 h-4" />
            <span>Lodge Grievance</span>
          </button>

          <Link
            to="/gis"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Open GIS Map</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid - Clickable Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div onClick={() => navigate('/projects')} className="cursor-pointer">
          <StatCard
            title="Total Projects"
            value={totalProjects}
            subtitle="Click to view all"
            icon={FolderKanban}
            color="blue"
          />
        </div>

        <div onClick={() => navigate('/projects?status=IN_PROGRESS')} className="cursor-pointer">
          <StatCard
            title="Ongoing"
            value={ongoingProjects}
            subtitle="In progress"
            icon={Clock}
            color="blue"
          />
        </div>

        <div onClick={() => navigate('/projects?status=COMPLETED')} className="cursor-pointer">
          <StatCard
            title="Completed"
            value={completedProjects}
            subtitle="Handed over"
            icon={CheckCircle2}
            color="emerald"
          />
        </div>

        <div onClick={() => navigate('/projects?status=DELAYED')} className="cursor-pointer">
          <StatCard
            title="Delayed"
            value={delayedProjects}
            subtitle="Schedule lag"
            icon={Clock}
            color="amber"
          />
        </div>

        <div onClick={() => navigate('/projects?risk=High')} className="cursor-pointer">
          <StatCard
            title="High Risk"
            value={highRiskCount}
            subtitle="🔴 AI Flagged"
            icon={FolderKanban}
            color="rose"
          />
        </div>

        <div onClick={() => navigate('/projects?risk=Critical')} className="cursor-pointer">
          <StatCard
            title="Critical Risk"
            value={criticalRiskCount}
            subtitle="🟣 Immediate Action"
            icon={FolderKanban}
            color="purple"
          />
        </div>
      </div>

      {/* Recharts Data Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress Chart */}
        <ChartCard
          title="Infrastructure Projects Progress"
          subtitle="Completion percentage per key project"
          className="lg:col-span-2"
          action={
            <Link to="/projects" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Details →
            </Link>
          }
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressChartData}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={10} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Budget Utilization Pie */}
        <ChartCard
          title="Budget Utilization Breakdown"
          subtitle="Sanctioned vs Utilized Capital"
          action={
            <Link to="/analytics" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Analytics →
            </Link>
          }
        >
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {budgetPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `₹${(val / 10000000).toFixed(2)} Cr`}
                  contentStyle={tooltipStyle}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Ward-Wise Development Chart */}
      <ChartCard
        title="Ward-Wise Development Metrics"
        subtitle="Completion rate (%) and budget allocation (₹ Cr) across Kopargaon Municipal Wards"
        action={
          <Link to="/gis" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
            View on GIS Map →
          </Link>
        }
      >
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wardDevelopmentData}>
              <XAxis dataKey="ward" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={11} />
              <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="progress" name="Progress (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="budgetCr" name="Budget (₹ Cr)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Recent Projects & Complaints Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects Section */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            {/* Requirement 1: Clicking Recent Smart City Projects title navigates to /projects */}
            <Link
              to="/projects"
              className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1.5"
            >
              <span>Recent Smart City Projects</span>
              <ArrowRight className="w-4 h-4 text-blue-500" />
            </Link>

            <Link to="/projects" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              View All Projects →
            </Link>
          </div>
          <ProjectTable projects={projects.slice(0, 5)} />
        </div>

        {/* Recent Citizen Complaints Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Link
              to="/complaints"
              className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center space-x-1.5"
            >
              <span>Recent Citizen Grievances</span>
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </Link>

            <Link to="/complaints" className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
              View All →
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 divide-y divide-slate-100 dark:divide-slate-800 space-y-3 shadow-xs">
            {complaints.slice(0, 4).map(c => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedComplaint(c);
                  setIsComplaintDetailOpen(true);
                }}
                className="pt-3 first:pt-0 space-y-1 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500">{c.category}</span>
                  <StatusBadge status={c.status} />
                </div>
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">{c.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.ward} • Reported {c.reportedDate}</p>
              </div>
            ))}
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
