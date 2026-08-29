import { useState, useEffect, useRef, useMemo } from 'react';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Layers, MapPin, ShieldAlert, GitCompare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { scenarioService } from '../services/api';
import GodavariFloodPanel from '../components/gis/GodavariFloodPanel';
import { KOPARGAON_CENTER } from '../data/mockData';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const BUILDINGS_3D_LAYER = {
  id: 'buildings-layer-f',
  type: 'fill-extrusion',
  source: 'buildings-f',
  paint: {
    'fill-extrusion-color': '#e5e7eb',
    'fill-extrusion-height': ['get', 'height_m'],
    'fill-extrusion-base': 0,
    'fill-extrusion-opacity': 0.95
  }
};

const FLOOD_GROUND_LAYER = {
  id: 'flood-extent-ground-layer-f',
  type: 'fill',
  source: 'flood-extent-f',
  paint: {
    'fill-color': '#38bdf8',
    'fill-opacity': 0.38,
    'fill-outline-color': '#0ea5e9'
  }
};

const FLOOD_3D_LAYER = {
  id: 'flood-extent-layer-f',
  type: 'fill-extrusion',
  source: 'flood-extent-f',
  paint: {
    'fill-extrusion-color': '#0f7490',
    'fill-extrusion-height': 3,
    'fill-extrusion-base': 0,
    'fill-extrusion-opacity': 0.78
  }
};

const isRenderableFeatureCollection = (value) => (
  value?.type === 'FeatureCollection' &&
  Array.isArray(value.features) &&
  value.features.every(feature => (
    feature?.type === 'Feature' &&
    ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type) &&
    Array.isArray(feature.geometry.coordinates) &&
    feature.geometry.coordinates.length > 0
  ))
);

const logGeoJSONPayload = (label, value) => {
  if (!value) {
    console.log(`[FLOOD 3D] ${label} payload is not available yet`);
    return;
  }
  const features = Array.isArray(value.features) ? value.features : [];
  const sample = features[0];
  console.log(`[FLOOD 3D] ${label} payload:`, JSON.stringify(value).slice(0, 500));
  console.log(`[FLOOD 3D] ${label} feature count:`, features.length);
  console.log(`[FLOOD 3D] ${label} sample geometry:`, sample?.geometry?.type, sample?.geometry?.coordinates);
  if (!isRenderableFeatureCollection(value)) {
    console.error(`[FLOOD 3D] Invalid or empty ${label} GeoJSON`, value);
  }
};

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
  const mapCenter = KOPARGAON_CENTER;
  
  // New Scenario State
  const [newScenario, setNewScenario] = useState({ name: '', type: 'road', description: '' });
  const [drawnGeometry, setDrawnGeometry] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [aiAssessment, setAiAssessment] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Comparison State
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  
  // Flood Twin State
  const [floodLevel, setFloodLevel] = useState(3);
  const [floodScenarios, setFloodScenarios] = useState(null);
  const [floodSummary, setFloodSummary] = useState(null);
  const [floodFacilities, setFloodFacilities] = useState(null);
  const [waterFeatures, setWaterFeatures] = useState(null);
  const [buildingsData, setBuildingsData] = useState(null);
  const [isFloodMapReady, setIsFloodMapReady] = useState(false);
  const [isFloodLoading, setIsFloodLoading] = useState(true);

  const mapRef = useRef(null);
  const floodMapRef = useRef(null);
  const drawRef = useRef(null);
  const [isRotating, setIsRotating] = useState(true);
  const rotationIntervalRef = useRef(null);
  const currentWaterHeight = useRef(3);

  useEffect(() => {
    fetchScenarios();
    fetchFloodData();
  }, []);

  async function fetchFloodData() {
    setIsFloodLoading(true);
    try {
      const [scenariosRes, summaryRes, facilitiesRes, waterRes, buildingsRes] = await Promise.all([
        api.get('/flood/scenarios'),
        api.get('/flood/summary'),
        api.get('/flood/facility-elevations'),
        api.get('/flood/water-features'),
        api.get('/flood/buildings')
      ]);
      setFloodScenarios(scenariosRes.data);
      setFloodSummary(summaryRes.data);
      setFloodFacilities(facilitiesRes.data);
      setWaterFeatures(waterRes.data);
      setBuildingsData(buildingsRes.data);
    } catch (error) {
      console.error('[FLOOD 3D] Failed to load flood data:', error);
      toast.error('Failed to load 3D flood data. Backend may still be deploying.');
    } finally {
      setIsFloodLoading(false);
    }
  }

  useEffect(() => {
    logGeoJSONPayload('buildings', buildingsData);
  }, [buildingsData]);

  const activeFloodPolygon = useMemo(() => {
    if (activeTab === 'flood' && isRenderableFeatureCollection(floodScenarios)) {
      const activeFeature = floodScenarios.features.find(f => Number(f.properties?.relative_rise_m) === Number(floodLevel));
      if (activeFeature) {
        return {
          type: 'FeatureCollection',
          features: [activeFeature]
        };
      }
    }
    return null;
  }, [activeTab, floodLevel, floodScenarios]);

  useEffect(() => {
    logGeoJSONPayload(`flood level +${floodLevel}m`, activeFloodPolygon);
  }, [activeFloodPolygon, floodLevel]);

  async function fetchScenarios() {
    try {
      const list = await scenarioService.getAll();
      setScenarios(list);
    } catch {
      toast.error('Failed to load scenarios');
    }
  }

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

  const updateArea = () => {
    const data = drawRef.current.getAll();
    if (data.features.length > 0) {
      // Get the first drawn polygon
      setDrawnGeometry(data.features[0].geometry);
    } else {
      setDrawnGeometry(null);
    }
  };

  // 3D Map Setup and Rotation
  const handleFloodMapError = (event) => {
    console.error('[FLOOD 3D] MapLibre error event:', event?.error || event);
  };

  const logFloodMapState = (map) => {
    try {
      const style = map.getStyle();
      console.log('[FLOOD 3D] sources:', Object.keys(style?.sources || {}));
      console.log('[FLOOD 3D] layers:', (style?.layers || []).map(layer => layer.id));
      console.log('[FLOOD 3D] building layer definition:', BUILDINGS_3D_LAYER);
      console.log('[FLOOD 3D] flood layer definition:', FLOOD_3D_LAYER);
    } catch (error) {
      console.error('[FLOOD 3D] Failed to inspect MapLibre style:', error);
    }
  };

  const handleFloodMapLoad = (event) => {
    const map = event?.target || floodMapRef.current?.getMap();
    if (!map) {
      console.error('[FLOOD 3D] Map load fired without a MapLibre instance');
      return;
    }

    try {
      console.log('[FLOOD 3D] MapLibre load reached; style loaded:', map.isStyleLoaded());
      console.log('[FLOOD 3D] pitch before:', map.getPitch());
      map.once('moveend', () => {
        console.log('[FLOOD 3D] pitch after:', map.getPitch());
        console.log('[FLOOD 3D] bearing after:', map.getBearing());
      });
      map.easeTo({ pitch: 55, bearing: -17.6, duration: 2000 });
      console.log('[FLOOD 3D] pitch after scheduling easeTo:', map.getPitch());
      setIsFloodMapReady(true);
      logFloodMapState(map);
    } catch (error) {
      console.error('[FLOOD 3D] Failed to initialize 3D camera:', error);
    }
  };

  useEffect(() => {
    if (activeTab !== 'flood') {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
      return undefined;
    }

    if (!isFloodMapReady || !isRotating || !floodMapRef.current) return undefined;
    rotationIntervalRef.current = setInterval(() => {
      try {
        const currentMap = floodMapRef.current?.getMap();
        if (currentMap?.loaded()) {
          currentMap.setBearing(currentMap.getBearing() + 0.05);
        }
      } catch (error) {
        console.error('[FLOOD 3D] Camera rotation failed:', error);
      }
    }, 100);

    return () => {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    };
  }, [activeTab, isRotating, isFloodMapReady]);

  useEffect(() => {
    if (activeTab !== 'flood' || !isFloodMapReady || !floodMapRef.current) return undefined;
    const map = floodMapRef.current.getMap();
    let animationFrame;
    let idleHandler;
    let cancelled = false;

    const animateWater = () => {
      if (cancelled || !map.loaded() || !map.isStyleLoaded()) return;
      if (!map.getLayer(FLOOD_3D_LAYER.id)) {
        console.error('[FLOOD 3D] Flood extrusion layer is missing:', FLOOD_3D_LAYER.id);
        return;
      }

      const targetHeight = Number(floodLevel);
      const startHeight = currentWaterHeight.current;
      console.log('[FLOOD 3D] Water height target (true scale, m):', targetHeight);
      const startTime = performance.now();
      const duration = 1500;

      const updateHeight = (time) => {
        if (cancelled) return;
        try {
          const progress = Math.min(1, (time - startTime) / duration);
          const newHeight = startHeight + (targetHeight - startHeight) * progress;
          currentWaterHeight.current = newHeight;
          map.setPaintProperty(FLOOD_3D_LAYER.id, 'fill-extrusion-height', newHeight);
          if (progress < 1) animationFrame = requestAnimationFrame(updateHeight);
        } catch (error) {
          console.error('[FLOOD 3D] Water height animation failed:', error);
        }
      };

      animationFrame = requestAnimationFrame(updateHeight);
    };

    if (map.loaded() && map.isStyleLoaded()) {
      animateWater();
    } else {
      idleHandler = () => animateWater();
      map.once('idle', idleHandler);
    }

    return () => {
      cancelled = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (idleHandler) map.off('idle', idleHandler);
    };
  }, [floodLevel, activeTab, isFloodMapReady]);

  useEffect(() => {
    if (activeTab !== 'flood' || !isFloodMapReady || !floodMapRef.current) return undefined;
    const map = floodMapRef.current.getMap();
    let frame;
    const inspect = () => {
      logFloodMapState(map);
      frame = undefined;
    };
    frame = requestAnimationFrame(inspect);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [activeTab, isFloodMapReady, buildingsData, waterFeatures, activeFloodPolygon]);

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
    } catch {
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
    } catch {
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
    } catch {
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
        <button
          onClick={() => setActiveTab('flood')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'flood' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Flood Twin
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

                {/* Water Features (Context) */}
                {waterFeatures?.water_bodies && (activeTab === 'flood' || activeTab === 'draw') && (
                  <Source id="water-bodies" type="geojson" data={waterFeatures.water_bodies}>
                    <Layer
                      id="water-bodies-layer"
                      type="fill"
                      paint={{
                        'fill-color': '#93c5fd',
                        'fill-opacity': 0.6
                      }}
                    />
                  </Source>
                )}
                {waterFeatures?.waterways && (activeTab === 'flood' || activeTab === 'draw') && (
                  <Source id="waterways" type="geojson" data={waterFeatures.waterways}>
                    <Layer
                      id="waterways-layer"
                      type="line"
                      paint={{
                        'line-color': '#60a5fa',
                        'line-width': 2
                      }}
                    />
                  </Source>
                )}

                {/* Flood Scenario Extent */}
                {activeFloodPolygon && activeTab === 'flood' && (
                  <Source id="flood-extent" type="geojson" data={activeFloodPolygon}>
                    <Layer
                      id="flood-extent-layer"
                      type="fill"
                      paint={{
                        'fill-color': 'rgba(200, 50, 50, 0.35)',
                        'fill-outline-color': '#ef4444'
                      }}
                    />
                  </Source>
                )}
              </Map>
            </div>
          </div>
        )}

        {activeTab === 'flood' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Control Panel */}
            <GodavariFloodPanel 
              selectedLevel={floodLevel}
              setSelectedLevel={setFloodLevel}
              summary={floodSummary}
              facilities={floodFacilities}
            />

            {/* Map Area */}
            <div className="lg:col-span-2 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-950">
              <Map
                ref={floodMapRef}
                onLoad={handleFloodMapLoad}
                onError={handleFloodMapError}
                maxPitch={85}
                pitchWithRotate={true}
                dragRotate={true}
                initialViewState={{
                  longitude: mapCenter[1],
                  latitude: mapCenter[0],
                  zoom: 14.5
                }}
                mapStyle={OSM_STYLE}
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationControl position="bottom-right" />
                
                {/* 3D Buildings */}
                {isRenderableFeatureCollection(buildingsData) && (
                  <Source id="buildings-f" type="geojson" data={buildingsData}>
                    <Layer {...BUILDINGS_3D_LAYER} />
                  </Source>
                )}

                {/* Water Features (Context) */}
                {waterFeatures?.water_bodies && (
                  <Source id="water-bodies-f" type="geojson" data={waterFeatures.water_bodies}>
                    <Layer
                      id="water-bodies-layer-f"
                      type="fill"
                      paint={{
                        'fill-color': '#93c5fd',
                        'fill-opacity': 0.6
                      }}
                    />
                  </Source>
                )}
                {waterFeatures?.waterways && (
                  <Source id="waterways-f" type="geojson" data={waterFeatures.waterways}>
                    <Layer
                      id="waterways-layer-f"
                      type="line"
                      paint={{
                        'line-color': '#60a5fa',
                        'line-width': 2
                      }}
                    />
                  </Source>
                )}

                {/* Full flood extent plus true-scale water depth */}
                {isRenderableFeatureCollection(activeFloodPolygon) && (
                  <Source id="flood-extent-f" type="geojson" data={activeFloodPolygon}>
                    <Layer {...FLOOD_GROUND_LAYER} />
                    <Layer {...FLOOD_3D_LAYER} />
                  </Source>
                )}
              </Map>
              
              {/* Loading Overlay */}
              {isFloodLoading && (
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <div className="text-white font-bold bg-slate-900/80 px-4 py-2 rounded-full shadow-lg">
                    Downloading 3D Twin Data...
                  </div>
                </div>
              )}

              {/* Camera Controls */}
              <div className="absolute bottom-6 left-4 flex gap-2">
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded shadow-sm text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {isRotating ? 'Pause Rotation' : 'Resume Rotation'}
                </button>
              </div>
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
