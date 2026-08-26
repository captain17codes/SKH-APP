import React from 'react';
import { Layers, X, Eye, EyeOff, BarChart2, MapPin, Square } from 'lucide-react';

const LAND_USE_LAYERS = [
  { id: 'landUse_Residential', label: 'Residential Zone', category: 'Residential', color: '#3b82f6', shape: 'Polygon Area' },
  { id: 'landUse_Commercial', label: 'Commercial Zone', category: 'Commercial', color: '#f59e0b', shape: 'Polygon Area' },
  { id: 'landUse_Industrial', label: 'Industrial Zone', category: 'Industrial', color: '#ec4899', shape: 'Polygon Area' },
  { id: 'landUse_Agricultural', label: 'Agricultural Belt', category: 'Agricultural', color: '#84cc16', shape: 'Polygon Area' },
  { id: 'landUse_Government', label: 'Institutional & Government', category: 'Government', color: '#8b5cf6', shape: 'Polygon Area' },
  { id: 'landUse_Green Zone', label: 'Open & Green Space Zone', category: 'Green Zone', color: '#10b981', shape: 'Polygon Area' }
];

const PROJECT_LAYERS = [
  { id: 'projects_Road', label: 'Roads & Transport Projects', category: 'Road', color: '#ef4444', shape: 'Point Marker' },
  { id: 'projects_Water', label: 'Water & SCADA Grid Projects', category: 'Water', color: '#06b6d4', shape: 'Point Marker' },
  { id: 'projects_TownPlanning', label: 'Town Planning & Infrastructure', category: 'Infrastructure', color: '#3b82f6', shape: 'Point Marker' },
  { id: 'projects_Energy', label: 'Energy & Power Projects', category: 'Energy', color: '#eab308', shape: 'Point Marker' },
  { id: 'projects_Other', label: 'Eco-Tourism & Heritage Projects', category: 'Tourism', color: '#a855f7', shape: 'Point Marker' }
];

const OTHER_GIS_LAYERS = [
  { id: 'wards', label: 'Municipal Wards Boundaries', color: '#3b82f6' },
  { id: 'cadastralPlots', label: 'Cadastral Plots (Mahabhunakasha)', color: '#f59e0b' },
  { id: 'roads', label: 'Road Network (GIS Lines)', color: '#64748b' },
  { id: 'buildings', label: 'Key Civic Buildings', color: '#8b5cf6' },
  { id: 'hospitals', label: 'Hospitals & Clinics', color: '#e11d48' },
  { id: 'schools', label: 'Schools & Colleges', color: '#2563eb' },
  { id: 'waterPipeline', label: 'Water Supply Grid', color: '#06b6d4' },
  { id: 'drainage', label: 'Drainage & Sewerage Network', color: '#a855f7' },
  { id: 'electricity', label: 'Power Sub-stations', color: '#eab308' },
  { id: 'floodRisk', label: 'Flood Risk Buffer Zone', color: '#ef4444' },
  { id: 'complaintHotspots', label: 'Grievance Hotspots', color: '#f97316' }
];

const MapLayerControl = ({
  activeLayers,
  onToggleLayer,
  isOpen,
  onToggleOpen,
  overlayMode,
  onSelectOverlayMode
}) => {
  // If panel closed, render "+ Add Layers & Analytics" floating button
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="absolute top-4 left-4 z-20 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-2 rounded-xl shadow-lg flex items-center space-x-1.5 transition-all duration-200 cursor-pointer text-xs border border-blue-500/20"
        title="Open Layers & Analytics Panel"
      >
        <Layers className="w-4 h-4" />
        <span>+ GIS Layers Control</span>
      </button>
    );
  }

  const isLayerActive = (id) => activeLayers[id] !== false;

  return (
    <div className="absolute top-4 bottom-auto left-4 right-4 sm:right-auto z-20 w-auto sm:w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col max-h-[560px] overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-200">
      {/* Header bar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 flex-shrink-0 bg-slate-50/75 dark:bg-slate-950/75">
        <div className="flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-blue-500" />
          <span>GIS Layers & Control</span>
        </div>
        <button
          onClick={onToggleOpen}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Hide Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Layers list scrollable container */}
      <div className="p-3 space-y-4 overflow-y-auto">
        {/* LAND USE GROUP (POLYGONS) */}
        <div className="space-y-1.5 bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/15">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center">
              <Square className="w-3 h-3 mr-1 fill-emerald-500/20 text-emerald-500" />
              LAND USE (POLYGONS / AREAS)
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Zoning parcels displayed as filled polygon areas on map
          </p>

          <div className="space-y-1 pt-1">
            {LAND_USE_LAYERS.map(layer => {
              const active = isLayerActive(layer.id);
              return (
                <div
                  key={layer.id}
                  onClick={() => onToggleLayer(layer.id)}
                  className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-3 h-3 rounded border border-white/60 flex-shrink-0" style={{ backgroundColor: layer.color }} />
                    <span className="truncate">{layer.label}</span>
                  </div>
                  {active ? <Eye className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* PROJECTS GROUP (POINT MARKERS) */}
        <div className="space-y-1.5 bg-blue-500/5 p-2.5 rounded-xl border border-blue-500/15">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-blue-500" />
              PROJECTS (POINT MARKERS)
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Development projects displayed as spatial point markers
          </p>

          <div className="space-y-1 pt-1">
            {PROJECT_LAYERS.map(layer => {
              const active = isLayerActive(layer.id);
              return (
                <div
                  key={layer.id}
                  onClick={() => onToggleLayer(layer.id)}
                  className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                    active
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white" style={{ backgroundColor: layer.color }} />
                    <span className="truncate">{layer.label}</span>
                  </div>
                  {active ? <Eye className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* OTHER GIS LAYERS & BOUNDARIES */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Boundaries & Infrastructure</span>
          {OTHER_GIS_LAYERS.map(layer => {
            const active = isLayerActive(layer.id);
            return (
              <div
                key={layer.id}
                onClick={() => onToggleLayer(layer.id)}
                className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                  active
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: layer.color }} />
                  <span className="truncate">{layer.label}</span>
                </div>
                {active ? <Eye className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
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
