import React from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Globe,
  Layers
} from 'lucide-react';

const MapTools = ({
  baseTileSource,
  onChangeBaseTile,
  onResetView,
  isFullscreen,
  onToggleFullscreen
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-xl text-xs">
      {/* Base Map Switcher */}
      <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-800 pr-1.5">
        <button
          onClick={() => onChangeBaseTile('osm')}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition-colors ${
            baseTileSource === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="OpenStreetMap Standard Vector"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">OSM</span>
        </button>

        <button
          onClick={() => onChangeBaseTile('satellite')}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition-colors ${
            baseTileSource === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Esri World Satellite Imagery"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Satellite</span>
        </button>
      </div>

      {/* Utility Actions */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onResetView}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset Map to Kopargaon Center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Full Screen View'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default MapTools;
