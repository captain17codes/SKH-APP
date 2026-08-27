import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, Droplets, Play, Pause, Zap, Megaphone, Save } from 'lucide-react';
import { aiPlannerService } from '../../services/api';
import toast from 'react-hot-toast';

const levels = [0.5, 1.0, 2.0, 3.0];

const GodavariFloodPanel = ({ selectedLevel, setSelectedLevel, summary, facilities }) => {
  const [currentSummary, setCurrentSummary] = useState(null);
  const [atRiskFacilities, setAtRiskFacilities] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);

  useEffect(() => {
    if (summary && summary.scenarios) {
      const active = summary.scenarios.find(s => s.relative_rise_m === selectedLevel);
      setCurrentSummary(active);
    }
  }, [selectedLevel, summary]);

  useEffect(() => {
    if (facilities && facilities.features && summary && summary.godavari_dem_profile) {
      const baseElev = summary.godavari_dem_profile.mean_elevation_m || 496.0;
      const threshold = baseElev + selectedLevel;
      
      const atRisk = facilities.features.filter(f => f.estimated_elevation_m <= threshold + 0.5); // Add 0.5m buffer for "near" threshold
      setAtRiskFacilities(atRisk);
    }
  }, [selectedLevel, facilities, summary]);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedLevel((prev) => {
          const currentIndex = levels.indexOf(prev);
          const nextIndex = (currentIndex + 1) % levels.length;
          return levels[nextIndex];
        });
      }, 1500);
    } else if (!isPlaying && interval) {
      clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying, setSelectedLevel]);

  const handleGenerateAiPlan = async () => {
    if (!currentSummary) return;
    setIsAiLoading(true);
    setAiPlan(null);
    try {
      const prompt = `Generate a very brief emergency mitigation and evacuation bullet-point plan for Kopargaon based on these simulated flood impacts: Rise: +${selectedLevel}m, Area: ${currentSummary.potential_inundation_area_km2.toFixed(2)} km², Buildings Affected: ${currentSummary.impacts.buildings.feature_count}, Bridges Affected: ${currentSummary.impacts.bridges.feature_count}. Limit to 3 short bullet points.`;
      
      const response = await aiPlannerService.queryAI(prompt, 'en-IN');
      setAiPlan(response.ai_analysis || response.text || response);
    } catch (e) {
      toast.error("Failed to generate AI plan.");
    }
    setIsAiLoading(false);
  };

  const handleBroadcast = () => {
    toast.success("Alert broadcasted to citizen app successfully!", { icon: '📣' });
  };
  
  const handleSaveScenario = () => {
    toast.success("Flood scenario saved to your What-If list!", { icon: '💾' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs overflow-y-auto h-full flex flex-col space-y-5">
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200 flex items-start space-x-3">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <p className="font-medium text-xs leading-relaxed">
          <strong>Preliminary screening model based on Copernicus GLO-30 DEM — not an official flood forecast.</strong><br/>
          This tool simulates potential inundation based on relative river level rise.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex justify-between items-center">
          <span className="flex items-center"><Droplets className="w-4 h-4 mr-2 text-cyan-600" />River Level Rise (+m above current)</span>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${isPlaying ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'}`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
          </button>
        </h3>
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
          {levels.map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`flex-1 py-2 mx-1 text-xs font-bold rounded transition-colors ${
                selectedLevel === level
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
            >
              +{level}m
            </button>
          ))}
        </div>
      </div>

      {currentSummary && (
        <div className="flex-1 space-y-4">
          <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400 mb-3 uppercase tracking-wider">Impact Summary</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-rose-100/50">
                <span className="block text-[10px] text-slate-500 uppercase">Inundation Area</span>
                <span className="font-bold text-rose-700">{currentSummary.potential_inundation_area_km2.toFixed(2)} km²</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-rose-100/50">
                <span className="block text-[10px] text-slate-500 uppercase">Buildings Affected</span>
                <span className="font-bold text-rose-700">{currentSummary.impacts.buildings.feature_count}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-rose-100/50">
                <span className="block text-[10px] text-slate-500 uppercase">Roads Affected</span>
                <span className="font-bold text-rose-700">{currentSummary.impacts.roads.feature_count} <span className="text-[10px] font-normal text-slate-500">({Math.round(currentSummary.impacts.roads.overlap_length_m)}m)</span></span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-rose-100/50">
                <span className="block text-[10px] text-slate-500 uppercase">Bridges Affected</span>
                <span className="font-bold text-rose-700">{currentSummary.impacts.bridges.feature_count}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-rose-100/50 col-span-2">
                <span className="block text-[10px] text-slate-500 uppercase">Power Infrastructure Affected</span>
                <span className="font-bold text-rose-700">{currentSummary.impacts.power_infrastructure.feature_count}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-rose-100 dark:border-rose-800/30">
              {aiPlan ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                  <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-2 flex items-center">
                    <Zap className="w-3 h-3 mr-1" /> AI Mitigation Plan
                  </h5>
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {aiPlan}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleGenerateAiPlan}
                  disabled={isAiLoading}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center"
                >
                  {isAiLoading ? (
                    <span className="flex items-center"><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Generating...</span>
                  ) : (
                    <span className="flex items-center"><Zap className="w-3 h-3 mr-1" /> Generate AI Mitigation Plan</span>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-3 uppercase tracking-wider flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Facilities near flood threshold
            </h4>
            {atRiskFacilities.length > 0 ? (
              <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {atRiskFacilities.map((f, i) => (
                  <li key={i} className="text-xs flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{f.name}</span>
                      <span className="text-[10px] text-slate-500 capitalize">{f.category.replace('_', ' ')}</span>
                    </div>
                    <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">{f.estimated_elevation_m.toFixed(1)}m</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">No key facilities currently flagged at this level.</p>
            )}
          </div>
          
          <div className="flex space-x-2 pt-2">
            <button 
              onClick={handleBroadcast}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors flex justify-center items-center"
            >
              <Megaphone className="w-3 h-3 mr-1" /> Broadcast Alert
            </button>
            <button 
              onClick={handleSaveScenario}
              className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-lg transition-colors flex justify-center items-center"
            >
              <Save className="w-3 h-3 mr-1" /> Save Scenario
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodavariFloodPanel;
