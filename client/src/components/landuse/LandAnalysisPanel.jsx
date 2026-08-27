import React from 'react';

const LandAnalysisPanel = ({ selectedPlot, onSimulateZoning, onClose }) => {
  if (!selectedPlot) {
    return (
      <div className="bg-surface rounded-xl shadow-md border border-outline-variant p-6 flex flex-col items-center justify-center text-center text-on-surface-variant h-full">
        <span className="material-symbols-outlined text-[48px] text-primary opacity-60 mb-4">map</span>
        <h4 className="font-title-lg text-title-lg text-on-surface mb-2">No Land Plot Selected</h4>
        <p className="font-body-sm text-body-sm">Click any land parcel on the Kopargaon spatial zoning map to evaluate AI suitability scores and infrastructure readiness.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-md border border-outline-variant flex flex-col h-full overflow-hidden">
      {/* Header Title */}
      <div className="p-5 border-b border-outline-variant flex items-start justify-between bg-surface-bright">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary mb-1 block">
            {selectedPlot.id} • {selectedPlot.category}
          </span>
          <h3 className="font-title-lg text-title-lg text-on-surface">{selectedPlot.name}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          {onClose && (
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
          <div className="text-right">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">AI Score</span>
            <span className="text-2xl font-black text-secondary">{selectedPlot.aiSuitabilityScore}/100</span>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
            <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Total Area</span>
            <span className="font-title-lg text-title-lg text-on-surface">{selectedPlot.areaAcres} Acres</span>
          </div>
          <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
            <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Current Usage</span>
            <span className="font-title-lg text-title-lg text-on-surface">{selectedPlot.currentUsage}</span>
          </div>
          <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
            <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Road Access</span>
            <span className="font-title-lg text-title-lg text-secondary">{selectedPlot.roadConnectivity}%</span>
          </div>
          <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
            <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Water Supply</span>
            <span className="font-title-lg text-title-lg text-secondary">{selectedPlot.waterAvailability}%</span>
          </div>
        </div>

        {/* Recommended Usage Banner */}
        <div className="bg-primary-container/10 border border-primary/20 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-[20px]">psychology</span>
            <span className="font-label-md text-label-md">AI Recommended Land Use</span>
          </div>
          <h4 className="font-title-lg text-title-lg text-on-surface mb-2">{selectedPlot.recommendedUsage}</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {selectedPlot.aiAnalysis}
          </p>
        </div>
      </div>

      {/* Action button */}
      {onSimulateZoning && (
        <div className="p-5 border-t border-outline-variant bg-surface-bright mt-auto">
          <button
            onClick={() => onSimulateZoning(selectedPlot)}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label-md text-label-md shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">explore</span>
            <span>Simulate Zonal Re-classification</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default LandAnalysisPanel;
