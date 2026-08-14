import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, LayoutGrid, ListFilter, ShieldAlert, CheckCircle2, Clock, AlertTriangle, Activity } from 'lucide-react';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectTable from '../components/projects/ProjectTable';
import ProjectModal from '../components/projects/ProjectModal';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';
import EmptyState from '../components/common/EmptyState';
import { projectService } from '../services/api';
import toast from 'react-hot-toast';

const ProjectsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [overview, setOverview] = useState({
    totalProjects: 0,
    ongoing: 0,
    completed: 0,
    delayed: 0,
    highRisk: 0,
    criticalRisk: 0
  });

  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchProjects = async () => {
    const list = await projectService.getAll();
    setProjects(list);
    const stats = await projectService.getOverview();
    setOverview(stats);
  };

  useEffect(() => {
    fetchProjects();
    const statusParam = searchParams.get('status');
    const wardParam = searchParams.get('ward');
    const riskParam = searchParams.get('risk');
    const createParam = searchParams.get('create');
    const catParam = searchParams.get('cat');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const descParam = searchParams.get('desc');

    if (statusParam) {
      setSelectedFilters(prev => ({ ...prev, status: statusParam }));
    }
    if (wardParam) {
      setSelectedFilters(prev => ({ ...prev, ward: wardParam }));
    }
    if (riskParam) {
      setSelectedRiskFilter(riskParam);
    }
    if (createParam === 'true') {
      const initialFields = {
        name: `AI Recommended ${catParam || 'Infrastructure'}`,
        category: catParam || 'Healthcare',
        description: descParam || 'Smart infrastructure project site.',
        coordinates: latParam && lngParam ? [parseFloat(latParam), parseFloat(lngParam)] : [19.8917, 74.4789],
        budget: 15000000,
        spent: 0,
        progress: 0,
        status: 'PLANNED'
      };
      setEditingProject(initialFields);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const filterConfigs = [
    {
      key: 'status',
      label: 'Status',
      options: ['PLANNED', 'APPROVED', 'IN_PROGRESS', 'DELAYED', 'COMPLETED', 'CANCELLED']
    },
    {
      key: 'department',
      label: 'Department',
      options: [
        'Public Works Department (PWD)',
        'Water Supply & Sanitation',
        'Urban Development & Irrigation',
        'Renewable Energy & Power',
        'Town Planning & Industry'
      ]
    }
  ];

  const handleFilterChange = (key, value) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCreate = async (newProject) => {
    await projectService.create(newProject);
    fetchProjects();
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleSaveEdit = async (id, updatedFields) => {
    await projectService.update(id, updatedFields);
    fetchProjects();
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete project ${id}?`)) {
      await projectService.delete(id);
      toast.success(`Project #${id} deleted successfully`);
      fetchProjects();
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.ward && p.ward.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !selectedFilters.status || (p.status || '').toUpperCase() === selectedFilters.status.toUpperCase();
    const matchesDept = !selectedFilters.department || p.department === selectedFilters.department;

    const pRisk = (p.aiRisk || p.riskAnalysis?.risk || 'UNKNOWN').toUpperCase();
    const matchesRisk = selectedRiskFilter === 'All' || pRisk === selectedRiskFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesDept && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <FolderKanban className="w-5 h-5 text-blue-500 mr-2" />
            AI Project Monitoring & Risk Prediction
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time project tracking, progress vs. schedule gap analysis, PostGIS grievance correlation, and AI risk scoring.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/gis?layer=smartProjects')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>GIS Map Risk Layer</span>
          </button>
          <button
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Project</span>
          </button>
        </div>
      </div>

      {/* AI City Overview Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projects</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{overview.totalProjects}</div>
          <span className="text-[10px] text-slate-500">Total registered</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-blue-500/20 p-3.5 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" /> Ongoing
          </span>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{overview.ongoing}</div>
          <span className="text-[10px] text-slate-500">In execution</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-500/20 p-3.5 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
          </span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{overview.completed}</div>
          <span className="text-[10px] text-slate-500">Handed over</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-amber-500/20 p-3.5 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1" /> Delayed
          </span>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{overview.delayed}</div>
          <span className="text-[10px] text-slate-500">Behind schedule</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-rose-500/20 p-3.5 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center">
            <ShieldAlert className="w-3 h-3 mr-1" /> High Risk
          </span>
          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{overview.highRisk}</div>
          <span className="text-[10px] text-rose-500/80 font-medium">🔴 AI High Risk</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-purple-500/20 p-3.5 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 flex items-center">
            <ShieldAlert className="w-3 h-3 mr-1" /> Critical
          </span>
          <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{overview.criticalRisk}</div>
          <span className="text-[10px] text-purple-500/80 font-medium">🟣 Immediate Action</span>
        </div>
      </div>

      {/* Project Risk Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0 mr-1">Project Risk:</span>
          {['All', 'Critical', 'High', 'Medium', 'Low', 'Unknown'].map((r) => {
            const isSelected = selectedRiskFilter.toLowerCase() === r.toLowerCase();
            let colorBadge = 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300';
            if (isSelected) {
              if (r === 'Critical') colorBadge = 'bg-purple-600 text-white shadow-sm';
              else if (r === 'High') colorBadge = 'bg-rose-600 text-white shadow-sm';
              else if (r === 'Medium') colorBadge = 'bg-amber-600 text-white shadow-sm';
              else if (r === 'Low') colorBadge = 'bg-emerald-600 text-white shadow-sm';
              else colorBadge = 'bg-blue-600 text-white shadow-sm';
            }

            return (
              <button
                key={r}
                onClick={() => setSelectedRiskFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex-shrink-0 ${colorBadge}`}
              >
                {r === 'Critical' && '🟣 '}
                {r === 'High' && '🔴 '}
                {r === 'Medium' && '🟠 '}
                {r === 'Low' && '🟢 '}
                {r === 'Unknown' && '⚪ '}
                {r}
              </button>
            );
          })}
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors ${
              viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors ${
              viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search & Category Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search projects by title, ward, ID..."
            className="w-full sm:w-72"
          />

          <FilterPanel
            filters={filterConfigs}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onReset={() => {
              setSelectedFilters({});
              setSelectedRiskFilter('All');
            }}
          />
        </div>
      </div>

      {/* Content Display */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No Projects Match Current Filter"
          description="No smart city infrastructure projects match your selected risk level, ward, or search criteria."
          action={
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilters({});
                setSelectedRiskFilter('All');
              }}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg cursor-pointer"
            >
              Clear All Filters
            </button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <ProjectTable
          projects={filteredProjects}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Project Form Modal (Create or Edit) */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        initialData={editingProject}
        onCreate={handleCreate}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default ProjectsPage;
