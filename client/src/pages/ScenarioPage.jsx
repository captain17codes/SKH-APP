import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Layers, MapPin, CheckCircle2, ShieldAlert, GitCompare, Save, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { scenarioService } from '../services/api';
import { KOPARGAON_CENTER } from '../data/mockData';

// OSM tile style matching MapView.jsx
const OSM_STYLE = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

const ScenarioPage = () => {
  const [activeTab, setActiveTab] = useState('draw'); // 'draw', 'list', 'compare'
  const [scenarios, setScenarios] = useState([]);
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  
  // New Scenario State
  const [newScenario, setNewScenario] = useState({ name: '', type: 'road', description: '' });
  const [drawnGeometry, setDrawnGeometry] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [aiAssessment, setAiAssessment] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Comparison State
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const list = await scenarioService.getAll();
      setScenarios(list);
    } catch (e) {
      toast.error('Failed to load scenarios');
    }
  };

  const initDraw = () => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!drawRef.current) {
      drawRef.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        }
      });
      map.addControl(drawRef.current, 'top-right');

      map.on('draw.create', updateArea);
      map.on('draw.delete', updateArea);
      map.on('draw.update', updateArea);
    }
  };

  const updateArea = (e) => {
    const data = drawRef.current.getAll();
    if (data.features.length > 0) {
      // Get the first drawn polygon
      setDrawnGeometry(data.features[0].geometry);
    } else {
      setDrawnGeometry(null);
    }
  };

  const handleRunAnalysis = async () => {
    if (!drawnGeometry) {
      toast.error("Please draw a polygon on the map first.");
      return;
    }
    if (!newScenario.name) {
      toast.error("Please provide a scenario name.");
      return;
    }

    setIsAnalyzing(true);
    toast.loading("Analyzing spatial conflicts...", { id: 'analysis' });
    try {
      const result = await scenarioService.create({
        name: newScenario.name,
        scenario_type: newScenario.type,
        description: newScenario.description,
        geometry: drawnGeometry
      });
      setAnalysisResult(result);
      toast.success("Analysis complete!", { id: 'analysis' });
      fetchScenarios();
    } catch (e) {
      toast.error("Failed to run analysis.", { id: 'analysis' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateAiAssessment = async () => {
    if (!analysisResult) return;
    setIsAnalyzing(true);
    toast.loading("Generating AI Assessment...", { id: 'ai' });
    try {
      const assessment = await scenarioService.getAiAssessment({
        scenarioId: analysisResult.id,
        name: analysisResult.name,
        scenario_type: analysisResult.scenario_type,
        conflict_count: analysisResult.conflict_count,
        conflict_details: analysisResult.conflict_details
      });
      setAiAssessment(assessment);
      
      // We don't save it automatically here, but we could if we added an endpoint for it.
      // Actually, let's assume the endpoint handles updating the DB.
      fetchScenarios(); 
      toast.success("AI Assessment ready!", { id: 'ai' });
    } catch (e) {
      toast.error("Failed to generate AI Assessment.", { id: 'ai' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this scenario?")) {
      await scenarioService.delete(id);
      fetchScenarios();
      if (selectedForCompare.includes(id)) {
        setSelectedForCompare(selectedForCompare.filter(s => s !== id));
      }
      toast.success("Deleted scenario.");
    }
  };

  const handleApprove = async (id) => {
    try {
      await scenarioService.updateStatus(id, 'APPROVED');
      toast.success("Scenario Approved!");
      fetchScenarios();
    } catch (e) {
      toast.error("Failed to approve scenario");
    }
  };

  const toggleCompare = (id) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(s => s !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        toast.error("You can only compare 2 scenarios at a time.");
        return;
      }
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
          <Layers className="w-6 h-6 text-indigo-500 mr-2" />
          WHAT-IF Scenario Engine
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Draw development zones on the map to evaluate structural conflicts and generate AI-driven impact assessments.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('draw')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'draw' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          New Scenario
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'list' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Saved Scenarios
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'compare' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Compare Scenarios ({selectedForCompare.length}/2)
        </button>
      </div>

      {/* Content area */}
      <div className="mt-4">
        {activeTab === 'draw' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Control Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs overflow-y-auto">
              <h3 className="text-md font-bold mb-4">Define Scenario</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Scenario Name</label>
                  <input 
                    type="text" 
                    value={newScenario.name}
                    onChange={(e) => setNewScenario({...newScenario, name: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                    placeholder="e.g., Godavari Bypass Alternative 1"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                  <select 
                    value={newScenario.type}
                    onChange={(e) => setNewScenario({...newScenario, type: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  >
                    <option value="road">Road / Highway</option>
                    <option value="drainage">Drainage Network</option>
                    <option value="water">Water Supply</option>
                    <option value="public_facility">Public Facility (Hospital/School)</option>
                    <option value="land_use">Land Use Re-zoning</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Description (Optional)</label>
                  <textarea 
                    value={newScenario.description}
                    onChange={(e) => setNewScenario({...newScenario, description: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm" 
                    rows="3"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                  <strong>Instructions:</strong> Use the polygon tool on the map to draw the boundaries of this scenario. Once drawn, run the analysis to detect structural conflicts.
                </div>

                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing || !drawnGeometry}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold shadow transition-colors flex items-center justify-center space-x-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Run Conflict Analysis</span>
                </button>

                {analysisResult && (
                  <div className="mt-4 p-4 border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 rounded-xl space-y-3">
                    <h4 className="font-bold text-rose-700 dark:text-rose-400 flex items-center">
                      <ShieldAlert className="w-4 h-4 mr-1.5" />
                      Analysis Results
                    </h4>
                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-rose-100 dark:border-rose-700/50">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Structures Affected:</span>
                      <span className="text-xl font-extrabold text-rose-600">{analysisResult.conflict_count}</span>
                    </div>

                    {analysisResult.land_use_impact && (
                      <div className="bg-white dark:bg-slate-800 p-3 rounded border border-rose-100 dark:border-rose-700/50">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Land Use Impact:</span>
                        <div className="space-y-1">
                          {analysisResult.land_use_impact.breakdown?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                              <span className="capitalize">{item.type}</span>
                              <span className="font-bold">{item.percentage.toFixed(1)}% ({Math.round(item.area_sqm)} sqm)</span>
                            </div>
                          ))}
                          {(!analysisResult.land_use_impact.breakdown || analysisResult.land_use_impact.breakdown.length === 0) && (
                            <div className="text-xs text-slate-500 italic">No land use zones affected.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {analysisResult.accessibility_analysis && (
                      <div className="bg-white dark:bg-slate-800 p-3 rounded border border-rose-100 dark:border-rose-700/50">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Accessibility (400m walk):</span>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Score:</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full ${
                            analysisResult.accessibility_analysis.score === 'High' ? 'bg-emerald-100 text-emerald-800' : 
                            analysisResult.accessibility_analysis.score === 'Medium' ? 'bg-amber-100 text-amber-800' : 
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {analysisResult.accessibility_analysis.score}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {Math.round(analysisResult.accessibility_analysis.accessible_area_sqm)} sqm of residential area is within a 5-minute walk.
                        </div>
                      </div>
                    )}

                    {analysisResult.environmental_risk && (
                      <div className="bg-white dark:bg-slate-800 p-3 rounded border border-rose-100 dark:border-rose-700/50">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Environmental Risk:</span>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Flood/Water Risk:</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full ${
                            analysisResult.environmental_risk.score === 'Low' ? 'bg-emerald-100 text-emerald-800' : 
                            analysisResult.environmental_risk.score === 'Medium' ? 'bg-amber-100 text-amber-800' : 
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {analysisResult.environmental_risk.score}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {analysisResult.environmental_risk.intersects_water 
                            ? "Warning: Scenario directly intersects a water body/waterway!" 
                            : analysisResult.environmental_risk.distance_to_nearest_water_m !== null
                              ? `Nearest water feature is ${Math.round(analysisResult.environmental_risk.distance_to_nearest_water_m)}m away.`
                              : "No water features detected in vicinity."}
                        </div>
                      </div>
                    )}

                    {!aiAssessment ? (
                      <button
                        onClick={handleGenerateAiAssessment}
                        disabled={isAnalyzing}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Generate AI Assessment
                      </button>
                    ) : (
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        <span className="font-bold text-indigo-600 block mb-2">AI Assessment:</span>
                        {aiAssessment}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Map Area */}
            <div className="lg:col-span-2 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-950">
              <Map
                ref={mapRef}
                onLoad={initDraw}
                initialViewState={{
                  longitude: mapCenter[1],
                  latitude: mapCenter[0],
                  zoom: 15
                }}
                mapStyle={OSM_STYLE}
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationControl position="bottom-right" />
                
                {analysisResult?.accessibility_analysis?.buffer_geometry && (
                  <Source id="accessibility-buffer" type="geojson" data={analysisResult.accessibility_analysis.buffer_geometry}>
                    <Layer 
                      id="accessibility-buffer-layer"
                      type="fill"
                      paint={{
                        'fill-color': '#4ade80',
                        'fill-opacity': 0.2,
                        'fill-outline-color': '#16a34a'
                      }}
                    />
                  </Source>
                )}
              </Map>
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map(s => (
              <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{s.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${s.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{s.description || 'No description'}</p>
                <div className="flex justify-between items-center text-sm font-semibold mb-4 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Conflicts:</span>
                  <span className={s.conflict_count > 0 ? 'text-rose-500' : 'text-emerald-500'}>{s.conflict_count}</span>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => toggleCompare(s.id)} className={`flex-1 text-xs py-1.5 font-bold rounded border ${selectedForCompare.includes(s.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}>
                    {selectedForCompare.includes(s.id) ? 'Selected' : 'Compare'}
                  </button>
                  <button onClick={() => handleApprove(s.id)} className="flex-1 text-xs py-1.5 font-bold rounded border hover:bg-emerald-50 text-emerald-600 border-emerald-200">
                    Approve
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded border hover:bg-rose-50 text-rose-600 border-rose-200">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'compare' && selectedForCompare.length === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedForCompare.map(id => {
              const s = scenarios.find(x => x.id === id);
              if (!s) return null;
              return (
                <div key={id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/30">
                    <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-100">{s.name}</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-semibold">{s.scenario_type}</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-600">Affected Structures:</span>
                      <span className={`text-xl font-extrabold ${s.conflict_count > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{s.conflict_count}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold mb-2">AI Assessment:</h4>
                      <div className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        {s.ai_assessment || "No AI assessment generated for this scenario."}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {activeTab === 'compare' && selectedForCompare.length < 2 && (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl text-slate-500">
            <GitCompare className="w-12 h-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-bold">Select 2 Scenarios to Compare</h3>
            <p className="text-sm mt-1">Go to the 'Saved Scenarios' tab and select exactly 2 scenarios.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioPage;
