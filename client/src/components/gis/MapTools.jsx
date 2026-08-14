import React from 'react';
import {
  Ruler,
  Maximize2,
  Minimize2,
  RotateCcw,
  Square,
  Pentagon,
  MapPin,
  Globe,
  Layers,
  Trash2,
  MousePointer
} from 'lucide-react';

const MapTools = ({
  activeTool,
  onSelectTool,
  baseTileSource,
  onChangeBaseTile,
  onResetView,
  isFullscreen,
  onToggleFullscreen,
  onClearDrawings
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-xl text-xs">
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

      {/* Interactive Tools */}
      <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-800 pr-1.5">
        <button
          onClick={() => onSelectTool(activeTool === 'select' ? 'none' : 'select')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'select' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Select Spatial Feature"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTool(activeTool === 'distance' ? 'none' : 'distance')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'distance' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Measure Distance (km)"
        >
          <Ruler className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTool(activeTool === 'polygon' ? 'none' : 'polygon')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'polygon' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Draw Custom Polygon"
        >
          <Pentagon className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTool(activeTool === 'rectangle' ? 'none' : 'rectangle')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'rectangle' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Draw Boundary Rectangle"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>

      {/* Utility Actions */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onClearDrawings}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
          title="Clear Measurement Drawings"
        >
          <Trash2 className="w-4 h-4" />
        </button>

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
          title={isFullscreen ? "Exit Fullscreen" : "Full Screen View"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default MapTools;
