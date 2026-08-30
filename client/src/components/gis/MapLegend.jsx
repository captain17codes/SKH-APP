import React from 'react';

const MapLegend = () => {
  return (
    <div className="bg-surface p-4 w-full">
      <h3 className="font-label-md text-label-md text-on-surface-variant uppercase mb-3 tracking-wider">Legend</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-sm bg-primary opacity-80 border border-primary-container"></div>
          <span className="font-body-sm text-body-sm text-on-surface">Ward Boundary</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-sm bg-[#10b981] opacity-80 border border-[#059669]"></div>
          <span className="font-body-sm text-body-sm text-on-surface">Residential Zone</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-sm bg-[#f59e0b] opacity-80 border border-[#d97706]"></div>
          <span className="font-body-sm text-body-sm text-on-surface">Commercial Zone</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-error border-2 border-white ring-1 ring-error"></div>
          <span className="font-body-sm text-body-sm text-on-surface">Critical Project</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-tertiary border-2 border-white ring-1 ring-tertiary"></div>
          <span className="font-body-sm text-body-sm text-on-surface">Complaint Hotspot</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-sm bg-[#3b82f6] opacity-80 border border-[#2563eb]"></div>
          <span className="font-body-sm text-body-sm text-on-surface">River Water</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-sm bg-[#0ea5e9] opacity-40 border border-[#0284c7]"></div>
          <span className="font-body-sm text-body-sm text-on-surface">Flood Affected Water</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
