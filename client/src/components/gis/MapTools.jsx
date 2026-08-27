import React from 'react';

const MapTools = ({
  onZoomIn,
  onZoomOut,
  onToggleSatellite,
  isSatellite
}) => {
  return (
    <div className="flex bg-surface border-b border-outline-variant overflow-x-auto w-full items-center shrink-0">
      <button 
        onClick={onZoomIn}
        className="h-12 w-12 flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors border-r border-outline-variant cursor-pointer shrink-0" 
        title="Zoom In"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>
      <button 
        onClick={onZoomOut}
        className="h-12 w-12 flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors border-r border-outline-variant cursor-pointer shrink-0" 
        title="Zoom Out"
      >
        <span className="material-symbols-outlined text-[20px]">remove</span>
      </button>
      <button 
        onClick={onToggleSatellite}
        className={`h-12 px-4 flex items-center justify-center gap-2 transition-colors border-r border-outline-variant cursor-pointer shrink-0 ${isSatellite ? 'bg-primary-container text-on-primary-container' : 'text-on-surface hover:bg-surface-container-low'}`} 
        title="Toggle Satellite View"
      >
        <span className="material-symbols-outlined text-[20px]">{isSatellite ? 'map' : 'satellite_alt'}</span>
        <span className="font-label-sm font-semibold">{isSatellite ? 'Map View' : 'Satellite View'}</span>
      </button>
      <button 
        className="h-12 w-12 flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors border-r border-outline-variant cursor-pointer shrink-0" 
        title="Measure Distance"
      >
        <span className="material-symbols-outlined text-[20px]">straighten</span>
      </button>
      <button 
        className="h-12 w-12 flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors border-r border-outline-variant cursor-pointer shrink-0" 
        title="Draw Polygon"
      >
        <span className="material-symbols-outlined text-[20px]">draw</span>
      </button>
    </div>
  );
};

export default MapTools;
