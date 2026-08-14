import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Search, MapPin, Calendar, Clock, Layers, AlertTriangle,
  Sparkles, CheckCircle2, RefreshCw, Filter, ArrowRight, ShieldCheck, TrendingUp, Info
} from 'lucide-react';
import { projectService } from '../services/api';
import MapView from '../components/gis/MapView';
import { KOPARGAON_CENTER } from '../data/mockData';
import { useTranslation } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'All',
  'Roads',
  'Water',
  'Drainage',
  'Smart City',
  'Public Facilities',
  'Commercial Development',
  'Infrastructure',
  'Other'
];

const STATUS_FILTERS = [
  'All Statuses',
  'Planned',
  'Approved',
  'Ongoing',
  'Near Completion',
  'Completed'
];

const BusinessUpcomingDevelopmentPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');

  // Overview Stats
  const [overview, setOverview] = useState({
    activeProjects: 0,
    plannedProjects: 0,
    nearCompletion: 0,
    totalBudget: 0,
    developmentAreas: 0
  });

  // Selected Project for Inspector
  const [selectedProject, setSelectedProject] = useState(null);
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [mapZoom, setMapZoom] = useState(14);

  const fetchProjectsData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await projectService.getAll();
      if (Array.isArray(data)) {
        setProjects(data);
        calculateOverview(data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('[Upcoming Development Fetch Error]:', err);
      setApiError('Unable to fetch upcoming development data right now.');
      toast.error('Failed to load project database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsData();
  }, []);

  const calculateOverview = (list) => {
    let active = 0, planned = 0, nearComp = 0, totalB = 0;
    const wardsSet = new Set();

    list.forEach(p => {
      const st = (p.status || '').toUpperCase();
      if (st.includes('ONGOING') || st.includes('IN_PROGRESS') || st.includes('APPROVED')) active++;
      if (st.includes('PLANNED')) planned++;
      if (p.progress >= 85 || st.includes('NEAR') || st.includes('COMPLETION')) nearComp++;

      totalB += Number(p.budget || 0);
      if (p.ward) wardsSet.add(p.ward);
    });

    setOverview({
      activeProjects: active,
      plannedProjects: planned,
      nearCompletion: nearComp,
      totalBudget: totalB,
      developmentAreas: wardsSet.size || 5
    });
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString()}`;
  };

  const handleViewOnBusinessGis = (project) => {
    const lat = project.coordinates?.[0] || project.lat || 19.8916;
    const lng = project.coordinates?.[1] || project.lng || 74.4789;
    navigate(`/business/gis?lat=${lat}&lng=${lng}&id=${project.id}`);
  };

  // Filtered Projects List
  const filteredProjects = projects.filter(p => {
    const nameStr = p.name || p.title || '';
    const idStr = p.id || '';
    const categoryStr = p.category || p.type || '';
    const wardStr = p.ward || '';
    const statusStr = p.status || '';

    const matchesSearch = !searchQuery || (
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wardStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryStr.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesCategory = selectedCategory === 'All' || categoryStr.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesStatus = selectedStatus === 'All Statuses' || (
      (selectedStatus === 'Ongoing' && (statusStr.toUpperCase().includes('ONGOING') || statusStr.toUpperCase().includes('IN_PROGRESS'))) ||
      (selectedStatus === 'Planned' && statusStr.toUpperCase().includes('PLANNED')) ||
      (selectedStatus === 'Approved' && statusStr.toUpperCase().includes('APPROVED')) ||
      (selectedStatus === 'Completed' && statusStr.toUpperCase().includes('COMPLETED')) ||
      (selectedStatus === 'Near Completion' && (p.progress >= 80 || statusStr.toUpperCase().includes('NEAR')))
    );

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate Potential Business Impact
  const getBusinessImpact = (p) => {
    const cat = (p.category || p.name || '').toLowerCase();
    if (cat.includes('road') || cat.includes('asphalt') || cat.includes('bridge') || cat.includes('surfacing')) {
      return {
        icon: '🚗',
        label: 'Road Improvement → Better Accessibility',
        desc: 'Potential impact: Improved vehicular traffic flow and logistics accessibility for commercial hubs in surrounding ward.'
      };
    } else if (cat.includes('water') || cat.includes('power') || cat.includes('drainage') || cat.includes('substation')) {
      return {
        icon: '⚡',
        label: 'New Infrastructure → Improved Development Potential',
        desc: 'Possible opportunity: Enhanced utility stability reducing operational overheads for commercial establishments.'
      };
    } else if (cat.includes('riverfront') || cat.includes('park') || cat.includes('promenade') || cat.includes('public')) {
      return {
        icon: '🌳',
        label: 'New Public Facility → Increased Surrounding Activity',
        desc: 'Potential impact: Higher footfall density creating potential opportunities for retail, dining & leisure businesses.'
      };
    } else {
      return {
        icon: '🏢',
        label: 'Commercial Development → Potential Customer Growth',
        desc: 'Possible opportunity: Increased economic activity and footfall requiring further market validation.'
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border border-blue-500/20 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">{t('businessPortal')}</span>
          <h1 className="text-2xl sm:text-3xl font-black">{t('upcomingDevelopment')}</h1>
          <p className="text-xs text-slate-300">Understand where Kopargaon's infrastructure and development activity is heading.</p>
        </div>

        <button
          onClick={fetchProjectsData}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('refresh')}</span>
        </button>
      </div>

      {apiError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button onClick={fetchProjectsData} className="underline font-bold">Retry API</button>
        </div>
      )}

      {/* OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('activeProjects')}</span>
          <p className="text-2xl font-black text-cyan-500">{overview.activeProjects}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('plannedProjects')}</span>
          <p className="text-2xl font-black text-purple-500">{overview.plannedProjects}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('nearCompletion')}</span>
          <p className="text-2xl font-black text-emerald-500">{overview.nearCompletion}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('totalDevelopmentBudget')}</span>
          <p className="text-lg font-black text-blue-500 truncate">{formatCurrency(overview.totalBudget)}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('developmentWards')}</span>
          <p className="text-2xl font-black text-amber-500">{overview.developmentAreas} Wards</p>
        </div>
      </div>

      {/* SEARCH & FILTERS ROW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Search Development Projects</label>
            <input
              type="text"
              placeholder="Search project name, ID, ward..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Project Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
            >
              {STATUS_FILTERS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PROJECT CARDS LIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-cyan-500" />
            <span>Infrastructure & Smart Development Projects ({filteredProjects.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse text-xs font-bold">
            Loading Kopargaon municipal development database...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3 text-xs">
            <Info className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No development data is currently available.</h4>
            <p className="text-slate-500">No project matches your search parameters.</p>
            <button onClick={fetchProjectsData} className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl">
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map(p => {
              const impact = getBusinessImpact(p);
              const progressVal = p.progress || 0;

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all space-y-4 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-cyan-500">ID: {p.id}</span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{p.name || p.title}</h4>
                        <p className="text-slate-500 text-[11px]">📍 {p.ward || 'Kopargaon Municipal Limits'}</p>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 font-bold text-[10px] uppercase">
                        {p.status || 'Ongoing'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Physical Completion Progress</span>
                        <span className="font-bold text-emerald-500">{progressVal}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" style={{ width: `${progressVal}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Category</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.category || 'Infrastructure'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Budget</span>
                        <span className="font-extrabold text-emerald-500">{formatCurrency(p.budget)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Target Date</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.expectedCompletion || 'Dec 2026'}</span>
                      </div>
                    </div>

                    {/* POTENTIAL BUSINESS IMPACT SECTION */}
                    <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-cyan-400">
                        {impact.icon} Potential Business Impact
                      </span>
                      <strong className="block text-slate-900 dark:text-slate-100">{impact.label}</strong>
                      <p className="text-[11px] leading-relaxed">{impact.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setSelectedProject(p)}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => handleViewOnBusinessGis(p)}
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-md cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View on Business GIS</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DEVELOPMENT MAP PREVIEW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">Spatial Pipeline</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-cyan-500" />
              <span>Kopargaon Development GIS Map</span>
            </h3>
          </div>
        </div>

        <div className="h-[400px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            showAllControls={true}
            height="h-full"
          />
        </div>
      </div>

      {/* AI DEVELOPMENT INSIGHT */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 border border-cyan-500/30 p-6 rounded-2xl text-white space-y-3 shadow-xl text-xs">
        <div className="flex items-center space-x-2 border-b border-cyan-500/20 pb-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold">AI Development Insight</h3>
        </div>

        <p className="text-slate-200 leading-relaxed p-4 rounded-xl bg-cyan-950/60 border border-cyan-500/20">
          "Several infrastructure projects are concentrated around Ward 4. Businesses evaluating this area should consider improved future accessibility, while accounting for possible short-term construction disruption."
        </p>
      </div>

      {/* PROJECT DETAILS MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full text-xs space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-500 font-bold">PROJECT DETAILS • #{selectedProject.id}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedProject.name || selectedProject.title}</h3>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <p><span className="text-slate-400">Ward Location:</span> <strong>{selectedProject.ward || 'Kopargaon W1-W6'}</strong></p>
              <p><span className="text-slate-400">Category:</span> <strong>{selectedProject.category || 'Infrastructure'}</strong></p>
              <p><span className="text-slate-400">Budget:</span> <strong className="text-emerald-500">{formatCurrency(selectedProject.budget)}</strong></p>
              <p><span className="text-slate-400">Target Completion:</span> <strong>{selectedProject.expectedCompletion || 'Dec 2026'}</strong></p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSelectedProject(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Close</button>
              <button onClick={() => { setSelectedProject(null); handleViewOnBusinessGis(selectedProject); }} className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-bold">View on Business GIS →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessUpcomingDevelopmentPage;
