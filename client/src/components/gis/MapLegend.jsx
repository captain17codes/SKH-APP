import React from 'react';
import { Info, Layers, ChevronDown, ChevronUp } from 'lucide-react';

const ZONING_CATEGORIES = [
  { name: 'Residential', color: '#3b82f6', desc: 'Housing & Apartments' },
  { name: 'Commercial', color: '#f59e0b', desc: 'Markets & Businesses' },
  { name: 'Industrial', color: '#ec4899', desc: 'MIDC Manufacturing' },
  { name: 'Agricultural', color: '#84cc16', desc: 'Farms & Sugarcane' },
  { name: 'Government', color: '#8b5cf6', desc: 'Civic Administrative' },
  { name: 'Green Zone', color: '#10b981', desc: 'Parks & River Buffer' }
];

const MapLegend = ({ isOpen, onToggleOpen, overlayMode = 'none' }) => {
  return (
    <div className="absolute bottom-6 right-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl transition-all max-w-xs text-xs">
      <div
        onClick={onToggleOpen}
        className="px-3.5 py-2 flex items-center justify-between cursor-pointer border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>GIS Spatial Legend</span>
        </div>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
      </div>

      {isOpen && (
        <div className="p-3 space-y-3">
          {/* Active Overlay Indicator */}
          {overlayMode !== 'none' && (
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-[11px]">
              <span className="font-bold block text-blue-600 dark:text-blue-400 capitalize">
                Analytics Mode: {overlayMode.replace('-', ' ')}
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
                Density heat gradients applied across municipal wards.
              </p>
            </div>
          )}

          {/* Land Use Zoning Legend */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Land-Use Master Zoning</span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {ZONING_CATEGORIES.map(cat => (
                <div key={cat.name} className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Vectors */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Vectors & Boundaries</span>
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
              <span className="w-4 h-0.5 bg-blue-500" />
              <span>Ward Boundary</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
              <span className="w-4 h-0.5 bg-cyan-500 border-t border-dashed" />
              <span>Water Grid Pipeline</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
              <span className="w-4 h-0.5 bg-rose-500" />
              <span>100-Yr River Flood Risk</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
