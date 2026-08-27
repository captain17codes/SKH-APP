import React from 'react';

const GIS_LAYERS = [
  { id: 'wards', label: 'Ward Boundaries' },
  { id: 'landUse', label: 'Land Use Zoning' },
  { id: 'cadastralPlots', label: 'Cadastral Plots' },
  { id: 'smartProjects', label: 'Smart Projects' },
  { id: 'complaintHotspots', label: 'Complaint Hotspots' },
  { id: 'roads', label: 'Road Network' },
  { id: 'buildings', label: 'Civic Buildings' },
  { id: 'hospitals', label: 'Hospitals & Clinics' },
  { id: 'schools', label: 'Schools & Colleges' },
  { id: 'waterPipeline', label: 'Water Grid' },
  { id: 'drainage', label: 'Drainage Network' },
  { id: 'electricity', label: 'Power Grid' },
  { id: 'floodRisk', label: 'Flood Risk Buffer' }
];

const MapLayerControl = ({
  activeLayers,
  onToggleLayer,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
        <h2 className="font-title-lg text-title-lg text-primary">Map Layers</h2>
        <span className="material-symbols-outlined text-on-surface-variant">layers</span>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto scrollbar-hide">
        {GIS_LAYERS.map(layer => {
          const isActive = activeLayers[layer.id] !== false;
          return (
            <label key={layer.id} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="peer sr-only" 
                  checked={isActive}
                  onChange={() => onToggleLayer(layer.id)}
                />
                <div className="w-5 h-5 rounded border border-outline-variant peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-white text-[16px] opacity-0 peer-checked:opacity-100">check</span>
                </div>
              </div>
              <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">{layer.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default MapLayerControl;
