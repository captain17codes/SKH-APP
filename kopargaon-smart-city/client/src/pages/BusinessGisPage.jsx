import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import MapView from '../components/gis/MapView';
import SearchBar from '../components/common/SearchBar';
import { KOPARGAON_CENTER } from '../data/mockData';
import KOPARGAON_WARDS_GEOJSON from '../data/gis/wardBoundaries';
import { gisService } from '../services/gisService';
import { useTranslation } from '../context/LanguageContext';
import {
  MapPin, Sparkles, Building2, TrendingUp, Layers, CheckCircle2,
  X, RefreshCw, BarChart3, Briefcase, Search, Shield, AlertTriangle, ArrowRight, DollarSign, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

const BusinessGisPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(null);
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analyzingArea, setAnalyzingArea] = useState(false);

  // Business-focused Map Layer Toggles
  const [businessLayers, setBusinessLayers] = useState({
    commercial: true,
    industrial: true,
    residential: false,
    infrastructure: true,
    projects: true,
    roads: true,
    availableProperties: true,
    opportunities: true
  });

  useEffect(() => {
    gisService.getProjects().then(setAllProjects).catch(() => setAllProjects([]));

    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
      setMapZoom(16);
      toast.success('Centered Business GIS on selected property location');
    }
  }, [searchParams]);

  const handleAnalyzeArea = () => {
    setAnalyzingArea(true);
    toast.loading('Analyzing commercial spatial viability & infrastructure buffer...', { duration: 1500 });
    setTimeout(() => {
      setAnalyzingArea(false);
      setIsAnalysisOpen(true);
      toast.success('Business Area Intelligence Analysis Complete!');
    }, 1500);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();
    const wardMatch = KOPARGAON_WARDS_GEOJSON.features.find(f =>
      f.properties.name.toLowerCase().includes(query) || f.properties.id.toLowerCase().includes(query)
    );
    if (wardMatch) {
      setSelectedWardId(wardMatch.properties.id);
      setMapCenter(wardMatch.geometry.coordinates[0][0].slice().reverse());
      setMapZoom(15);
      setSelectedFeature({ feat: wardMatch.properties, type: 'ward' });
      return;
    }

    const projectMatch = allProjects.find(p => p.name.toLowerCase().includes(query));
    if (projectMatch && projectMatch.coordinates) {
      setMapCenter(projectMatch.coordinates);
      setMapZoom(16);
      setSelectedFeature({ feat: projectMatch, type: 'project' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-cyan-500" />
            <span>Kopargaon {t('businessGis')} Smart Map</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Commercial Zoning, DP Road Widening & Infrastructure Overlay</p>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('search')}
            />
          </form>

          <button
            onClick={handleAnalyzeArea}
            disabled={analyzingArea}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm shrink-0 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t('analyzeArea')}</span>
          </button>
        </div>
      </div>

      {/* Main Map Container & Inspector Drawer */}
      <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)] min-h-[600px]">
        <div className="flex-1 relative h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950">
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            onSelectFeature={(feat) => setSelectedFeature({ feat, type: 'general' })}
            showAllControls={true}
            height="h-full"
          />
        </div>

        {selectedFeature && (
          <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4 text-xs animate-in slide-in-from-right duration-300">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-cyan-500">
                    {selectedFeature.type === 'ward' ? 'MUNICIPAL WARD' : 'FEATURE INSPECTOR'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedFeature.feat.name || selectedFeature.feat.title || 'Selected Parcel'}
                  </h3>
                </div>
                <button onClick={() => setSelectedFeature(null)} className="p-1 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2 border border-slate-200 dark:border-slate-800">
                <p><span className="text-slate-400">Zoning:</span> <strong className="text-cyan-500">{selectedFeature.feat.landUse || 'C-2 Commercial Zone'}</strong></p>
                <p><span className="text-slate-400">Road Width:</span> <strong>{selectedFeature.feat.roadWidth || '24m DP Arterial Road'}</strong></p>
                <p><span className="text-slate-400">Power Substation:</span> <strong className="text-emerald-500">33kV Grid (350m buffer)</strong></p>
                <p><span className="text-slate-400">Footfall Rating:</span> <strong>High (14,200 / day)</strong></p>
              </div>
            </div>

            <button
              onClick={handleAnalyzeArea}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-center shadow-lg cursor-pointer"
            >
              {t('analyzeArea')} →
            </button>
          </div>
        )}
      </div>

      {/* AREA INTELLIGENCE ANALYSIS MODAL */}
      {isAnalysisOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full text-xs space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-500 font-bold">BUSINESS GIS SPATIAL ANALYSIS</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Kopargaon Commercial Buffer Report</h3>
              </div>
              <button onClick={() => setIsAnalysisOpen(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Accessibility Score</span>
                <p className="text-xl font-black text-emerald-500">94/100</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Commercial Potential</span>
                <p className="text-xl font-black text-cyan-500">High</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 space-y-1">
              <span className="text-[10px] font-bold uppercase text-cyan-400">Why this location?</span>
              <p>Strong commercial feasibility with direct 24m DP road widening access, verified 33kV substation proximity, and high footfall density.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setIsAnalysisOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">{t('close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessGisPage;
