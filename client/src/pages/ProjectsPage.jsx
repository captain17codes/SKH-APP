import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectTable from '../components/projects/ProjectTable';
import ProjectModal from '../components/projects/ProjectModal';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';
import { projectService } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../context/LanguageContext';

const ProjectsPage = () => {
  const { t } = useTranslation();
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

  const [viewMode, setViewMode] = useState('table');
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

  const statuses = ['All Statuses', 'Planned', 'Approved', 'Ongoing', 'Completed', 'Delayed', 'Cancelled'];
  const categories = ['All Categories', 'Infrastructure', 'Healthcare', 'Renewable Energy', 'Town Planning'];

  return (
    <div className="flex flex-col gap-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface dark:text-inverse-on-surface">Projects Directory</h2>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-inverse-on-surface mt-1">Manage and track all active and planned municipal initiatives.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/gis?layer=smartProjects')}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant dark:border-outline rounded-lg text-on-surface dark:text-inverse-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-[18px]">map</span>
            GIS Risk Layer
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant dark:border-outline rounded-lg text-on-surface dark:text-inverse-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors font-label-md text-label-md">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <button 
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-colors shadow-sm font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Project
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-surface dark:bg-inverse-surface p-4 rounded-xl shadow-ambient-lvl1 border border-outline-variant dark:border-outline flex flex-col gap-4">
        {/* Status Filter */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-20 shrink-0">Status</span>
          <div className="flex flex-wrap gap-2">
            {statuses.map(s => {
              const mappedStatus = s === 'All Statuses' ? '' : (s === 'Ongoing' ? 'IN_PROGRESS' : s.toUpperCase());
              const isActive = (selectedFilters.status || '') === mappedStatus;
              return (
                <button
                  key={s}
                  onClick={() => handleFilterChange('status', mappedStatus)}
                  className={`px-3 py-1.5 rounded-full border font-label-sm text-label-sm transition-colors cursor-pointer ${
                    isActive 
                      ? 'border-primary bg-primary-fixed text-on-primary-container' 
                      : 'border-outline-variant dark:border-outline text-on-surface-variant hover:border-primary hover:text-primary dark:hover:text-primary-fixed-dim'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
        
        <hr className="border-outline-variant dark:border-outline"/>
        
        {/* Risk / AI Priority Filter (Mapping to Category spot in mockup) */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-20 shrink-0">Risk Level</span>
          <div className="flex flex-wrap gap-2">
            {['All', 'Critical', 'High', 'Medium', 'Low', 'Unknown'].map(r => {
              const isActive = selectedRiskFilter === r;
              let activeClasses = 'border-primary bg-primary-fixed text-on-primary-container';
              if (isActive && r === 'Critical') activeClasses = 'border-error bg-error-container text-on-error-container';
              else if (isActive && r === 'High') activeClasses = 'border-error bg-error-container text-on-error-container';
              
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRiskFilter(r)}
                  className={`px-3 py-1.5 rounded-full border font-label-sm text-label-sm transition-colors cursor-pointer ${
                    isActive 
                      ? activeClasses 
                      : 'border-outline-variant dark:border-outline text-on-surface-variant hover:border-primary hover:text-primary'
                  }`}
                >
                  {r === 'Critical' && '🟣 '}
                  {r === 'High' && '🔴 '}
                  {r}
                </button>
              );
            })}
          </div>
          
          <div className="ml-auto mt-2 md:mt-0 flex items-center gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('searchProjectsPlaceholder')}
              className="w-48 sm:w-64"
            />
            <div className="flex items-center bg-surface-container-lowest dark:bg-surface-variant p-1 rounded-lg border border-outline-variant dark:border-outline">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md flex items-center transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'
                }`}
                title="Grid View"
              >
                <span className="material-symbols-outlined text-sm">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md flex items-center transition-colors ${
                  viewMode === 'table' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'
                }`}
                title="Table View"
              >
                <span className="material-symbols-outlined text-sm">table_rows</span>
              </button>
            </div>
          </div>
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
              className="px-4 py-2 font-label-md text-label-md bg-primary text-on-primary rounded-lg cursor-pointer hover:bg-primary-container transition-colors"
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
        <div className="bg-surface dark:bg-inverse-surface rounded-xl shadow-ambient-lvl1 border border-outline-variant dark:border-outline overflow-hidden">
          <ProjectTable
            projects={filteredProjects}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
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
