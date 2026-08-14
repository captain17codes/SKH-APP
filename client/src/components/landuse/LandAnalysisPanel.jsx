import React from 'react';
import { Sparkles, MapPin, Zap, Droplets, Compass, CheckCircle2, ChevronRight } from 'lucide-react';

const LandAnalysisPanel = ({ selectedPlot, onSimulateZoning }) => {
  if (!selectedPlot) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-60" />
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">No Land Plot Selected</h4>
        <p className="mt-1">Click any land parcel on the Kopargaon spatial zoning map to evaluate AI suitability scores and infrastructure readiness.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 text-xs">
      {/* Header Title */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {selectedPlot.id} • {selectedPlot.category}
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedPlot.name}</h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">AI Suitability Score</span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{selectedPlot.aiSuitabilityScore}/100</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
        <div>
          <span className="text-slate-400 block text-[10px]">Total Area</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPlot.areaAcres} Acres</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Current Usage</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPlot.currentUsage}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Road Access</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedPlot.roadConnectivity}%</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Water Supply</span>
          <span className="font-semibold text-cyan-600 dark:text-cyan-400">{selectedPlot.waterAvailability}%</span>
        </div>
      </div>

      {/* Recommended Usage Banner */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 border border-blue-500/20 p-3.5 rounded-xl">
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold mb-1">
          <Sparkles className="w-4 h-4" />
          <span>AI Recommended Land Use</span>
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedPlot.recommendedUsage}</h4>
        <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
          {selectedPlot.aiAnalysis}
        </p>
      </div>

      {/* Action button */}
      {onSimulateZoning && (
        <button
          onClick={() => onSimulateZoning(selectedPlot)}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
        >
          <Compass className="w-4 h-4" />
          <span>Simulate Zonal Re-classification</span>
        </button>
      )}
    </div>
  );
};

export default LandAnalysisPanel;
