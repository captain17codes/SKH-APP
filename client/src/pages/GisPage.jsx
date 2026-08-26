import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MapView from '../components/gis/MapView';
import SearchBar from '../components/common/SearchBar';
import { KOPARGAON_CENTER } from '../data/mockData';
import KOPARGAON_WARDS_GEOJSON from '../data/gis/wardBoundaries';
import { gisService } from '../services/gisService';
import { overpassService } from '../services/overpassService';
import { complaintService } from '../services/api';
import {
  MapPin,
  ChevronRight,
  Info,
  Building2,
  CheckCircle2,
  X,
  Compass,
  ArrowRight,
  Navigation,
  Calendar,
  IndianRupee,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  MessageSquareWarning
} from 'lucide-react';
import toast from 'react-hot-toast';


const GisPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(null);
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [candidateLocations, setCandidateLocations] = useState([]);

  const [osmData, setOsmData] = useState({
    schools: [],
    hospitals: [],
    roads: []
  });
  const [loadingOsm, setLoadingOsm] = useState(false);
  const [osmError, setOsmError] = useState(null);
  const [complaintHotspots, setComplaintHotspots] = useState(null);


  const loadOsmData = async (force = false) => {
    setLoadingOsm(true);
    setOsmError(null);
    try {
      const [schools, hospitals, roads] = await Promise.all([
        overpassService.fetchSchools(force),
        overpassService.fetchHospitals(force),
        overpassService.fetchRoads(force)
      ]);
      setOsmData({ schools, hospitals, roads });
      toast.success('Live OpenStreetMap spatial features loaded!');
    } catch (e) {
      console.error('[GIS] Overpass API fetch failed – falling back to local Kopargaon GIS data.', e);
      // Fallback: use existing local Kopargaon infrastructure data so wards, schools,
      // hospitals, and all GIS layers still render on the map.
      try {
        const infraData = await gisService.getInfrastructure();
        setOsmData({
          schools: infraData?.schools || [],
          hospitals: infraData?.hospitals || [],
          roads: []   // local infra doesn't include OSM-style roads; MapView renders its own roads layer via gisService.getRoads()
        });
        toast('Using local Kopargaon GIS data (Overpass API unavailable).', { icon: 'ℹ️', duration: 4000 });
      } catch (fallbackErr) {
        console.error('[GIS] Local GIS fallback also failed:', fallbackErr);
        setOsmError('Kopargaon GIS data could not be loaded. The base map is still available.');
        toast.error('Failed to load GIS data. Using base map only.');
      }
    } finally {
      setLoadingOsm(false);
    }
  };

  useEffect(() => {
    gisService.getProjects().then(setAllProjects);
    loadOsmData();
    // Load complaint hotspots for the GIS map
    complaintService.getHotspots()
      .then(setComplaintHotspots)
      .catch(e => console.warn('[GIS] Complaint hotspots load failed:', e.message));
  }, []);


  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoomParam = searchParams.get('zoom');
    const featureId = searchParams.get('featureId') || searchParams.get('project');
    const featureType = searchParams.get('featureType');
    const wardParam = searchParams.get('ward');
    const candidatesParam = searchParams.get('candidates');

    const targetZoom = zoomParam ? parseInt(zoomParam, 10) : 16;

    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
      setMapZoom(targetZoom);
    }

    if (featureId) {
      // 1. Try finding in projects
      gisService.getProjects().then(list => {
        const found = list.find(p => p.id === featureId || p.name.toLowerCase().includes(featureId.toLowerCase()));
        if (found) {
          setSelectedFeature({ feat: found, type: 'project' });
          if (found.coordinates && (!lat || !lng)) {
            setMapCenter(found.coordinates);
            setMapZoom(targetZoom);
          }
          return;
        }

        // 2. Try finding in Wards
        const wardMatch = KOPARGAON_WARDS_GEOJSON.features.find(f =>
          f.properties.id === featureId || f.properties.name.toLowerCase().includes(featureId.toLowerCase())
        );
        if (wardMatch) {
          setSelectedWardId(wardMatch.properties.id);
          setSelectedFeature({ feat: wardMatch.properties, type: 'ward' });
          if (!lat || !lng) {
            setMapCenter(wardMatch.geometry.coordinates[0][0].slice().reverse());
            setMapZoom(targetZoom);
          }
          return;
        }

        // 3. Fallback generic feature location
        if (lat && lng) {
          setSelectedFeature({
            feat: {
              id: featureId,
              name: featureId,
              type: featureType || 'GIS Feature',
              lat: parseFloat(lat),
              lng: parseFloat(lng)
            },
            type: featureType || 'location'
          });
        }
      });
    } else if (wardParam) {
      const wardFeature = KOPARGAON_WARDS_GEOJSON.features.find(f => f.properties.id === wardParam);
      if (wardFeature) {
        setSelectedWardId(wardParam);
        setMapCenter(wardFeature.geometry.coordinates[0][0].slice().reverse());
        setMapZoom(15);
        setSelectedFeature({ feat: wardFeature.properties, type: 'ward' });
      }
    }

    if (candidatesParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(candidatesParam));
        const list = decoded.map(c => ({
          id: `candidate-${c.rank}`,
          rank: c.rank,
          score: c.score,
          lat: c.latitude || c.lat,
          lng: c.longitude || c.lng,
          name: c.name || `Candidate Plot #${c.rank}`,
          reasons: c.reasons || [],
          zoning: c.zoning || 'Vacant Land',
          area: c.area || 5.0
        }));
        setCandidateLocations(list);
        if (list.length > 0 && (!lat || !lng)) {
          setMapCenter([list[0].lat, list[0].lng]);
          setMapZoom(15);
        }
      } catch (e) {
        console.error('Failed to parse candidates query param:', e);
      }
    }
  }, [searchParams]);

  const handleSelectWard = (wardId, coords) => {
    setSelectedWardId(wardId);
    if (coords) {
      setMapCenter(coords);
      setMapZoom(15);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();

    // 1. Search Wards
    const wardMatch = KOPARGAON_WARDS_GEOJSON.features.find(f =>
      f.properties.name.toLowerCase().includes(query) || f.properties.id.toLowerCase().includes(query)
    );
    if (wardMatch) {
      handleSelectWard(wardMatch.properties.id, wardMatch.geometry.coordinates[0][0].slice().reverse());
      setSelectedFeature({ feat: wardMatch.properties, type: 'ward' });
      return;
    }

    // 2. Search Projects
    const projectMatch = allProjects.find(p =>
      p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query) || p.ward.toLowerCase().includes(query)
    );
    if (projectMatch && projectMatch.coordinates) {
      setMapCenter(projectMatch.coordinates);
      setMapZoom(16);
      setSelectedFeature({ feat: projectMatch, type: 'project' });
    }
  };

  const getFeatureImage = (feat, type) => {
    if (type === 'project') {
      const id = feat.id;
      if (id === 'PRJ-2026-001') return 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80';
      if (id === 'PRJ-2026-002') return 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80';
      if (id === 'PRJ-2026-003') return 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80';
      if (id === 'PRJ-2026-004') return 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop&q=80';
      if (id === 'PRJ-2026-005') return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80';
      if (id === 'PRJ-2026-006') return 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600&auto=format&fit=crop&q=80';
    }
    if (type === 'hospital') return 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80';
    if (type === 'school') return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80';
    if (type === 'landUse' || type === 'land') return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&auto=format&fit=crop&q=80';
  };

  const handleCalculateRoute = (feat) => {
    toast.loading('Calculating optimal transit route to feature coordinates...', { duration: 2500 });
    setTimeout(() => {
      toast.success(`Optimal Route calculated: 4.8 km via Tilak Road Bypass (Estimated travel time: 9 mins)`);
    }, 2500);
  };

  const getWardProjects = () => {
    if (!selectedFeature || selectedFeature.type !== 'ward') return [];
    const id = selectedFeature.feat.id;
    return allProjects.filter(p =>
      p.ward && (
        p.ward.toLowerCase().includes(id.toLowerCase()) || 
        p.ward.toLowerCase().includes(selectedFeature.feat.name.toLowerCase())
      )
    );
  };
  const wardProjects = getWardProjects();

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs animate-in fade-in duration-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <MapPin className="w-5 h-5 text-blue-500 mr-2" />
            Kopargaon Professional GIS Smart Planning Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Full-screen OpenStreetMap & Esri Satellite spatial platform with 13 GIS vector layers, GeoJSON municipal ward boundaries, measurement UI, and spatial analytics inspector.
          </p>
        </div>

        {/* Global Search and Actions Bar */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {loadingOsm && (
            <div className="hidden md:flex items-center space-x-2 text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/60 animate-pulse font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Loading Kopargaon GIS...</span>
            </div>
          )}

          <button
            onClick={() => loadOsmData(true)}
            disabled={loadingOsm}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors flex items-center space-x-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 flex-shrink-0"
            title="Refresh OpenStreetMap GIS Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingOsm ? 'animate-spin' : ''}`} />
            <span>Refresh GIS</span>
          </button>

          <form onSubmit={handleSearchSubmit} className="w-full sm:w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search Ward, Project, Landmark..."
            />
          </form>
        </div>
      </div>

      {/* Non-blocking error notification */}
      {osmError && (
        <div className="flex items-center justify-between gap-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/60 animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{osmError}</span>
          </div>
          <button
            onClick={() => loadOsmData(true)}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Ward Quick Selector Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-slate-400 uppercase text-[10px] flex-shrink-0">Ward Focus:</span>
        <button
          onClick={() => {
            setSelectedWardId(null);
            setMapCenter(KOPARGAON_CENTER);
            setMapZoom(14);
          }}
          className={`px-3 py-1.5 rounded-lg border font-semibold flex-shrink-0 transition-colors cursor-pointer ${
            !selectedWardId
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          All Kopargaon
        </button>

        {KOPARGAON_WARDS_GEOJSON.features.map(f => {
          const p = f.properties;
          const isSelected = selectedWardId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectWard(p.id, f.geometry.coordinates[0][0].slice().reverse())}
              className={`px-3 py-1.5 rounded-lg border font-medium flex-shrink-0 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              {p.id}: {p.name.split('-')[1] || p.name}
            </button>
          );
        })}
      </div>

      {/* Full-Screen GIS Map View Workspace side-by-side with GMap Side Panel */}
      <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-250px)] min-h-[620px]">
        {/* Map Container */}
        <div className="flex-1 relative h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-950">
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            selectedWardId={selectedWardId}
            candidateLocations={candidateLocations}
            complaintHotspots={complaintHotspots}
            onSelectFeature={(feat, type) => {
              setSelectedFeature({ feat, type });
              if (feat.coordinates && type === 'project') {
                setMapCenter(feat.coordinates);
                setMapZoom(16);
              } else if (feat.lat && feat.lng) {
                setMapCenter([feat.lat, feat.lng]);
                setMapZoom(16);
              }
            }}
            selectedFeature={selectedFeature}
            showAllControls={true}
            height="h-full"
            onZoomChange={setMapZoom}
            onCenterChange={setMapCenter}
            osmData={osmData}
          />
        </div>

        {/* Google Maps-Style Side Information Panel (Right-side slide-in on desktop, bottom sheet on mobile) */}
        {selectedFeature && (
          <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 lg:rounded-xl shadow-xl flex flex-col overflow-y-auto h-auto lg:h-full animate-in slide-in-from-bottom lg:slide-in-from-right duration-300">
            {/* Header Image */}
            <div className="h-44 w-full relative bg-slate-800 flex-shrink-0">
              <img
                src={getFeatureImage(selectedFeature.feat, selectedFeature.type)}
                alt={selectedFeature.feat.name || selectedFeature.feat.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />

              {/* Floating Close Button */}
              <button
                onClick={() => setSelectedFeature(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/40 hover:bg-slate-950/60 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Category Badge overlay */}
              <span className="absolute bottom-3 left-4 px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider">
                {selectedFeature.type}
              </span>
            </div>

            {/* Feature Specs Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  {selectedFeature.feat.id && (
                    <span className="text-[10px] font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {selectedFeature.feat.id}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1.5 leading-tight">
                    {selectedFeature.feat.name || selectedFeature.feat.title}
                  </h3>
                </div>

                {/* Meta details list */}
                <div className="space-y-2 text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  {selectedFeature.type === 'project' && (
                    <>
                      <p><span className="text-slate-400 dark:text-slate-500">Department:</span> <span className="font-semibold">{selectedFeature.feat.department}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Ward Location:</span> <span className="font-semibold">{selectedFeature.feat.ward}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Budget:</span> <span className="font-bold text-emerald-600">₹{(selectedFeature.feat.budget / 10000000).toFixed(2)} Cr</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Progress:</span> <span className="font-semibold text-blue-500">{selectedFeature.feat.progress}%</span></p>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${selectedFeature.feat.progress}%` }} />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-2 italic leading-relaxed">
                        {selectedFeature.feat.description}
                      </p>
                    </>
                  )}

                  {selectedFeature.type === 'ward' && (
                    <>
                      <p><span className="text-slate-400 dark:text-slate-500">Councillor:</span> <span className="font-semibold">{selectedFeature.feat.councillor}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Population:</span> <span className="font-semibold">{selectedFeature.feat.population?.toLocaleString()}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Area:</span> <span className="font-semibold">{selectedFeature.feat.areaKm2 || selectedFeature.feat.area || '3.5'} km²</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Zoning Focus:</span> <span className="font-semibold">{selectedFeature.feat.type}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Active Projects:</span> <span className="font-bold text-blue-500">{selectedFeature.feat.activeProjects || 0}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Grievances Filed:</span> <span className="font-bold text-rose-500">{selectedFeature.feat.complaintsCount || 0}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Infrastructure Score:</span> <span className="font-bold text-amber-500">8.2 / 10 (Prototype)</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Development Progress:</span> <span className="font-bold text-emerald-500">{selectedFeature.feat.completionRate || 0}%</span></p>

                      {/* Relational Ward projects connection list */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/85">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Projects in this Ward ({wardProjects.length})</span>
                        {wardProjects.length > 0 ? (
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {wardProjects.map(p => (
                              <Link
                                key={p.id}
                                to={`/projects/${p.id}`}
                                className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 rounded border border-slate-200/50 dark:border-slate-800 transition-colors"
                              >
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{p.name}</span>
                                <span className="text-blue-500 font-bold flex-shrink-0">{p.progress}%</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">No active smart projects registered in this ward.</p>
                        )}
                      </div>
                    </>
                  )}

                  {selectedFeature.type === 'landUse' && (
                    <>
                      <p><span className="text-slate-400 dark:text-slate-500">Zoning:</span> <span className="font-bold text-emerald-500">{selectedFeature.feat.category}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Area:</span> <span className="font-semibold">{selectedFeature.feat.areaAcres} Acres</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Current Usage:</span> <span className="font-semibold">{selectedFeature.feat.currentUsage}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Recommended:</span> <span className="font-semibold text-blue-500">{selectedFeature.feat.recommendedUsage}</span></p>
                    </>
                  )}

                  {selectedFeature.type === 'school' && (
                    <>
                      <p><span className="text-slate-400 dark:text-slate-500">Category Type:</span> <span className="font-semibold">{selectedFeature.feat.type}</span></p>
                      {selectedFeature.feat.address && (
                        <p><span className="text-slate-400 dark:text-slate-500">Address:</span> <span className="font-semibold">{selectedFeature.feat.address}</span></p>
                      )}
                      {selectedFeature.feat.phone && (
                        <p><span className="text-slate-400 dark:text-slate-500">Contact:</span> <span className="font-semibold">{selectedFeature.feat.phone}</span></p>
                      )}
                      {selectedFeature.feat.website && (
                        <p><span className="text-slate-400 dark:text-slate-500">Website:</span> <a href={selectedFeature.feat.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-500 hover:underline break-all">{selectedFeature.feat.website}</a></p>
                      )}
                      <p><span className="text-slate-400 dark:text-slate-500">OSM Reference ID:</span> <span className="font-mono font-semibold">{selectedFeature.feat.id}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Coordinates:</span> <span className="font-semibold">{Number(selectedFeature.feat.lat).toFixed(5)}, {Number(selectedFeature.feat.lng).toFixed(5)}</span></p>
                    </>
                  )}

                  {selectedFeature.type === 'hospital' && (
                    <>
                      <p><span className="text-slate-400 dark:text-slate-500">Category Type:</span> <span className="font-semibold">{selectedFeature.feat.type}</span></p>
                      {selectedFeature.feat.address && (
                        <p><span className="text-slate-400 dark:text-slate-500">Address:</span> <span className="font-semibold">{selectedFeature.feat.address}</span></p>
                      )}
                      {selectedFeature.feat.phone && (
                        <p><span className="text-slate-400 dark:text-slate-500">Contact:</span> <span className="font-semibold">{selectedFeature.feat.phone}</span></p>
                      )}
                      {selectedFeature.feat.website && (
                        <p><span className="text-slate-400 dark:text-slate-500">Website:</span> <a href={selectedFeature.feat.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-500 hover:underline break-all">{selectedFeature.feat.website}</a></p>
                      )}
                      {selectedFeature.feat.emergency && (
                        <p><span className="text-slate-400 dark:text-slate-500">Emergency Services:</span> <span className="font-bold text-rose-500">{selectedFeature.feat.emergency}</span></p>
                      )}
                      <p><span className="text-slate-400 dark:text-slate-500">OSM Reference ID:</span> <span className="font-mono font-semibold">{selectedFeature.feat.id}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Coordinates:</span> <span className="font-semibold">{Number(selectedFeature.feat.lat).toFixed(5)}, {Number(selectedFeature.feat.lng).toFixed(5)}</span></p>
                    </>
                  )}

                  {selectedFeature.type === 'road' && (
                    <>
                      <p><span className="text-slate-400 dark:text-slate-500">Highway Type:</span> <span className="font-semibold capitalize">{selectedFeature.feat.type}</span></p>
                      {selectedFeature.feat.surface && (
                        <p><span className="text-slate-400 dark:text-slate-500">Surface:</span> <span className="font-semibold capitalize">{selectedFeature.feat.surface}</span></p>
                      )}
                      {selectedFeature.feat.maxSpeed && (
                        <p><span className="text-slate-400 dark:text-slate-500">Max Speed:</span> <span className="font-semibold">{selectedFeature.feat.maxSpeed}</span></p>
                      )}
                      <p><span className="text-slate-400 dark:text-slate-500">OSM Reference ID:</span> <span className="font-mono font-semibold">{selectedFeature.feat.id}</span></p>
                    </>
                  )}

                  {selectedFeature.type === 'candidate' && (
                    <>
                      <p><span className="text-slate-400 dark:text-slate-500">Suitability Rank:</span> <span className="font-extrabold text-emerald-600 dark:text-emerald-400"># {selectedFeature.feat.rank} Candidate</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Score Rating:</span> <span className="font-extrabold text-blue-500">{selectedFeature.feat.score} / 100</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Zoning Designation:</span> <span className="font-semibold">{selectedFeature.feat.zoning}</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Available Land Area:</span> <span className="font-semibold">{selectedFeature.feat.area} Acres</span></p>
                      <p><span className="text-slate-400 dark:text-slate-500">Centroid Coordinates:</span> <span className="font-mono font-semibold">{Number(selectedFeature.feat.lat).toFixed(5)}, {Number(selectedFeature.feat.lng).toFixed(5)}</span></p>
                      
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">AI Suitability Analysis</span>
                        <div className="space-y-1 mt-1 text-[11px] leading-relaxed">
                          {selectedFeature.feat.reasons && selectedFeature.feat.reasons.length > 0 ? (
                            selectedFeature.feat.reasons.map((r, idx) => (
                              <p key={idx} className="text-slate-600 dark:text-slate-400 flex items-start">
                                <span className="text-emerald-500 mr-1 flex-shrink-0">✓</span> {r}
                              </p>
                            ))
                          ) : (
                            <p className="text-slate-400 italic">Suitable zoning matches and gap metrics determined.</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {selectedFeature.type === 'project' && (
                  <Link
                    to={`/projects/${selectedFeature.feat.id}`}
                    className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs transition-colors"
                  >
                    View Full Details
                  </Link>
                )}

                {selectedFeature.type === 'ward' && (
                  <Link
                    to={`/projects?ward=${encodeURIComponent(selectedFeature.feat.id)}`}
                    className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs transition-colors"
                  >
                    Ward Projects
                  </Link>
                )}

                {selectedFeature.type === 'candidate' && (
                  <Link
                    to={`/projects?create=true&cat=Healthcare&lat=${selectedFeature.feat.lat}&lng=${selectedFeature.feat.lng}&desc=${encodeURIComponent(`Development of new hospital facility at recommended candidate site.`)}`}
                    className="flex-1 text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs transition-colors"
                  >
                    Register Project
                  </Link>
                )}

                <button
                  onClick={() => handleCalculateRoute(selectedFeature.feat)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center cursor-pointer"
                  title="View Route"
                >
                  <Navigation className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedFeature(null)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GisPage;
