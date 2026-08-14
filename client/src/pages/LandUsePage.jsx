import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, MapPin, CheckCircle2, Compass } from 'lucide-react';
import MapView from '../components/gis/MapView';
import LandAnalysisPanel from '../components/landuse/LandAnalysisPanel';
import { landService } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../context/LanguageContext';

const LAND_CATEGORIES = [
  'All Zones',
  'Residential',
  'Commercial',
  'Industrial',
  'Agriculture',
  'Government',
  'Green Zone',
  'Mixed Use'
];

const LandUsePage = () => {
  const { t } = useTranslation();
  const [plots, setPlots] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Zones');
  const [selectedPlot, setSelectedPlot] = useState(null);

  useEffect(() => {
    landService.getAll().then(data => {
      setPlots(data);
      if (data.length > 0) setSelectedPlot(data[0]);
    });
  }, []);

  const filteredPlots = selectedCategory === 'All Zones'
    ? plots
    : plots.filter(p => p.category === selectedCategory);

  const handleSimulateZoning = (plot) => {
    toast.success(`Zonal simulation initialized for ${plot.name}. AI recommendation logged in Master Plan draft.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <Layers className="w-5 h-5 text-emerald-500 mr-2" />
            {t('interactiveLandUse')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('interactiveLandUseDesc')}
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        {LAND_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg border font-semibold flex-shrink-0 transition-colors ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            {t(cat.replace(/\s+/g, ''))}
          </button>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Interactive Map + Parcel Selector */}
        <div className="lg:col-span-2 space-y-4">
          <MapView
            center={selectedPlot ? selectedPlot.coordinates : [19.8917, 74.4789]}
            zoom={14}
            height="h-[520px]"
          />

          {/* Plot selector grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPlots.map(plot => (
              <div
                key={plot.id}
                onClick={() => setSelectedPlot(plot)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedPlot?.id === plot.id
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{plot.id}</span>
                  <span className="text-[10px] font-bold text-slate-400">{plot.areaAcres} Acres</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">{plot.name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Current: {plot.currentUsage}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right AI Land Analysis Inspector Panel */}
        <div>
          <LandAnalysisPanel
            selectedPlot={selectedPlot}
            onSimulateZoning={handleSimulateZoning}
          />
        </div>
      </div>
    </div>
  );
};

export default LandUsePage;
