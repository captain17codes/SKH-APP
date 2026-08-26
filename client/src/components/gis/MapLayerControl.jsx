import React from 'react';
import { Layers, X, Eye, EyeOff, BarChart2 } from 'lucide-react';

const GIS_LAYER_DEFINITIONS = [
  { id: 'wards', label: 'Municipal Wards', category: 'Boundaries', color: '#3b82f6' },
  { id: 'cadastralPlots', label: 'Cadastral Plots (Mahabhunakasha)', category: 'Boundaries', color: '#f59e0b' },
  { id: 'landUse', label: 'Land Use Zoning', category: 'Boundaries', color: '#10b981' },
  { id: 'roads', label: 'Road Network', category: 'Infrastructure', color: '#64748b' },
  { id: 'buildings', label: 'Key Civic Buildings', category: 'Infrastructure', color: '#8b5cf6' },
  { id: 'smartProjects', label: 'Smart City Projects', category: 'Infrastructure', color: '#3b82f6' },
  { id: 'hospitals', label: 'Hospitals & Clinics', category: 'Civic Facilities', color: '#e11d48' },
  { id: 'schools', label: 'Schools & Colleges', category: 'Civic Facilities', color: '#2563eb' },
  { id: 'governmentLand', label: 'Government Land Reserves', category: 'Civic Facilities', color: '#6366f1' },
  { id: 'waterPipeline', label: 'Water Supply Grid', category: 'Utilities', color: '#06b6d4' },
  { id: 'drainage', label: 'Drainage & Sewerage', category: 'Utilities', color: '#a855f7' },
  { id: 'electricity', label: 'Power Sub-stations', category: 'Utilities', color: '#eab308' },
  { id: 'floodRisk', label: 'Flood Risk Buffer Zone', category: 'Environmental', color: '#ef4444' }
];

const MapLayerControl = ({
  activeLayers,
  onToggleLayer,
  isOpen,
  onToggleOpen,
  overlayMode,
  onSelectOverlayMode
}) => {
  // If the panel is closed, only show a compact "+ Layers" floating button
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="absolute top-4 left-4 z-20 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-2 rounded-xl shadow-lg flex items-center space-x-1.5 transition-all duration-200 cursor-pointer text-xs border border-blue-500/20"
        title="Open Layers & Analytics Panel"
      >
        <Layers className="w-4 h-4" />
        <span>+ Add Layers & Analytics</span>
      </button>
    );
  }

  // If the panel is open, show the full floating side panel (bottom sheet on mobile)
  return (
    <div className="absolute top-4 bottom-auto left-4 right-4 sm:right-auto z-20 w-auto sm:w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col max-h-[500px] overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-200">
      {/* Header bar with Close icon */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 flex-shrink-0 bg-slate-50/55 dark:bg-slate-950/55">
        <div className="flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-blue-500" />
          <span>GIS Layers & Analytics</span>
        </div>
        <button
          onClick={onToggleOpen}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Hide Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Layers list content scrollable */}
      <div className="p-3 space-y-4 overflow-y-auto">
        {/* Spatial Vector Layers */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vector GIS Layers</span>
          {GIS_LAYER_DEFINITIONS.map(layer => {
            const isActive = activeLayers[layer.id];
            return (
              <div
                key={layer.id}
                onClick={() => onToggleLayer(layer.id)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: layer.color }} />
                  <span className="truncate">{layer.label}</span>
                </div>
                {isActive ? <Eye className="w-3.5 h-3.5 text-blue-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </div>
            );
          })}
        </div>

        {/* Analytics Visualization Overlay Modes */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center">
            <BarChart2 className="w-3 h-3 mr-1 text-purple-500" />
            Spatial Heatmap Analytics
          </span>

          {[
            { id: 'none', label: 'Standard Map View' },
            { id: 'project-density', label: 'Project Density Heatmap' },
            { id: 'complaint-density', label: 'Grievance Hotspots' },
            { id: 'development-progress', label: 'Ward Progress Metrics' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => onSelectOverlayMode(mode.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                overlayMode === mode.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapLayerControl;
