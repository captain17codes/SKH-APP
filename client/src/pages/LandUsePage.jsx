import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, MapPin, CheckCircle2, Compass } from 'lucide-react';
import MapView from '../components/gis/MapView';
import LandAnalysisPanel from '../components/landuse/LandAnalysisPanel';
import { landService } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../context/LanguageContext';

const LAND_CATEGORIES = [
  'All Zones',
  'Residential',
  'Commercial',
  'Industrial',
  'Agriculture',
  'Green Zone',
  'Mixed Use'
];

const LandUsePage = () => {
  const { t } = useTranslation();
  const [plots, setPlots] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Zones');
  const [selectedPlot, setSelectedPlot] = useState(null);

  useEffect(() => {
    landService.getAll().then(data => {
      setPlots(data);
    });
  }, []);

  const handleSimulateZoning = (plot) => {
    toast.success(`Zonal simulation initialized for ${plot.name}. AI recommendation logged in Master Plan draft.`);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-stack-gap md:gap-section-gap w-full h-[calc(100vh-64px)] overflow-hidden">
      {/* Left: GIS Map Area */}
      <section className="flex-1 flex flex-col bg-surface rounded-xl shadow-md border border-outline-variant relative overflow-hidden h-full min-h-[400px]">
        {/* Map Header/Controls overlay */}
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-surface/90 to-transparent z-10 flex justify-between items-start pointer-events-none">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Land Use Viewer</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Interactive zoning map for Kopargaon jurisdiction</p>
          </div>
          <div className="flex items-center gap-2 bg-surface p-1.5 rounded-lg shadow-sm border border-outline-variant pointer-events-auto">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-body-sm font-label-md focus:ring-0 py-1 pl-2 pr-8 text-on-surface cursor-pointer outline-none"
            >
              {LAND_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* The Map Canvas */}
        <div className="flex-1 relative w-full h-full">
          <MapView
            center={selectedPlot ? selectedPlot.coordinates : [19.8917, 74.4789]}
            zoom={14}
            height="h-full"
            activeLayers={{ landUse: true }}
            onCenterChange={() => {}}
            onZoomChange={() => {}}
          />
        </div>
      </section>

      {/* Right: Details & Legend Panel */}
      <section className="w-full lg:w-[360px] xl:w-[400px] flex flex-col gap-stack-gap h-full overflow-y-auto pb-8 lg:pb-0 pr-1">
        {selectedPlot ? (
          <LandAnalysisPanel
            selectedPlot={selectedPlot}
            onSimulateZoning={handleSimulateZoning}
            onClose={() => setSelectedPlot(null)}
          />
        ) : (
          <>
            {/* Zone Analysis Summary Card */}
            <div className="bg-surface rounded-xl shadow-md border border-outline-variant p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-title-lg text-title-lg text-on-surface">Zone Analysis</h3>
                <button className="text-primary hover:bg-surface-container-low p-1 rounded transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Total Parcels</p>
                  <p className="font-headline-md text-headline-md text-primary">12,450</p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Total Area (Sq.Km)</p>
                  <p className="font-headline-md text-headline-md text-primary">45.2</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between font-label-md text-label-md mb-1">
                    <span className="text-on-surface">Compliance Rate</span>
                    <span className="text-secondary">92%</span>
                  </div>
                  <div className="w-full bg-surface-variant rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend Card */}
            <div className="bg-surface rounded-xl shadow-md border border-outline-variant flex-1 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-outline-variant">
                <h3 className="font-title-lg text-title-lg text-on-surface">Zoning Distribution</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Current land allocation metrics</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {[
                  { name: 'Residential', color: '#FFC107', borderColor: '#B38705', pct: '42%', area: '18.9 Sq.Km' },
                  { name: 'Commercial', color: '#F44336', borderColor: '#AB2E26', pct: '15%', area: '6.7 Sq.Km' },
                  { name: 'Industrial', color: '#9C27B0', borderColor: '#6D1B7B', pct: '12%', area: '5.4 Sq.Km' },
                  { name: 'Green Zone', color: '#4CAF50', borderColor: '#357A38', pct: '18%', area: '8.1 Sq.Km' },
                  { name: 'Agriculture', color: '#8D6E63', borderColor: '#634D45', pct: '8%', area: '3.6 Sq.Km' },
                  { name: 'Mixed Use', color: '#FF9800', borderColor: '#B36A00', pct: '3%', area: '1.3 Sq.Km' },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded-lg transition-colors cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded border" style={{ backgroundColor: item.color, borderColor: item.borderColor }}></div>
                      <span className="font-body-md text-body-md text-on-surface">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-label-md text-label-md text-on-surface block">{item.pct}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{item.area}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default LandUsePage;
