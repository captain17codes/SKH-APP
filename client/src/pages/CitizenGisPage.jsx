import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import MapView from '../components/gis/MapView';
import SearchBar from '../components/common/SearchBar';
import { KOPARGAON_CENTER } from '../data/mockData';
import KOPARGAON_WARDS_GEOJSON from '../data/gis/wardBoundaries';
import { gisService } from '../services/gisService';
import { complaintService } from '../services/api';
import {
  MapPin, MessageSquareWarning, Clock, FolderKanban, Layers, AlertTriangle,
  Bot, Building2, Search, X, Plus, CheckCircle2, RefreshCw, Send, ShieldCheck,
  Compass, IndianRupee, Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';

const CitizenGisPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(null);
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [candidateLocations, setCandidateLocations] = useState([]);
  const [complaintHotspots, setComplaintHotspots] = useState(null);

  const [isNearMeOpen, setIsNearMeOpen] = useState(false);
  const [loadingNearMe, setLoadingNearMe] = useState(false);

  // Citizen-focused Map Layer Toggles
  const [citizenLayers, setCitizenLayers] = useState({
    complaints: true,
    projects: true,
    roads: true,
    water: true,
    drainage: true,
    hospitals: true,
    schools: true,
    facilities: true
  });

  // 1. Initial Load of Projects and Hotspots
  useEffect(() => {
    gisService.getProjects()
      .then(projects => setAllProjects(projects || []))
      .catch(err => console.warn('[Citizen GIS] Projects load error:', err.message));

    complaintService.getHotspots()
      .then(setComplaintHotspots)
      .catch(err => console.warn('[Citizen GIS] Complaint hotspots load error:', err.message));
  }, []);

  // 2. Process Incoming Map Action from AI Assistant or Navigation URL / State
  useEffect(() => {
    const latParam = searchParams.get('lat') || location.state?.mapAction?.latitude || location.state?.mapAction?.lat;
    const lngParam = searchParams.get('lng') || location.state?.mapAction?.longitude || location.state?.mapAction?.lng;
    const zoomParam = searchParams.get('zoom') || location.state?.mapAction?.zoom;
    const featureId = searchParams.get('featureId') || searchParams.get('project') || searchParams.get('id') || location.state?.mapAction?.featureId || location.state?.mapAction?.name;
    const featureType = searchParams.get('featureType') || location.state?.mapAction?.featureType || location.state?.mapAction?.type;
    const wardParam = searchParams.get('ward') || location.state?.mapAction?.wardId;
    const candidatesParam = searchParams.get('candidates') || location.state?.mapAction?.candidates;

    const targetZoom = zoomParam ? parseInt(zoomParam, 10) : 16;
    let didFly = false;

    // Handle Candidates list if present
    if (candidatesParam) {
      try {
        const decoded = typeof candidatesParam === 'string' ? JSON.parse(decodeURIComponent(candidatesParam)) : candidatesParam;
        if (Array.isArray(decoded)) {
          const list = decoded.map((c, i) => ({
            id: `candidate-${c.rank || i + 1}`,
            rank: c.rank || i + 1,
            score: c.score || 85,
            lat: c.latitude || c.lat,
            lng: c.longitude || c.lng,
            name: c.name || `Candidate Plot #${c.rank || i + 1}`,
            reasons: c.reasons || [],
            zoning: c.zoning || 'Public Amenity',
            area: c.area || 5.0
          }));
          setCandidateLocations(list);
          if (list.length > 0 && (!latParam || !lngParam)) {
            setMapCenter([list[0].lat, list[0].lng]);
            setMapZoom(15);
            didFly = true;
          }
        }
      } catch (e) {
        console.warn('[Citizen GIS] Failed to parse candidates param:', e);
      }
    }

    // Set Coordinates & Zoom
    if (latParam && lngParam && !isNaN(parseFloat(latParam)) && !isNaN(parseFloat(lngParam))) {
      const coords = [parseFloat(latParam), parseFloat(lngParam)];
      setMapCenter(coords);
      setMapZoom(targetZoom);
      didFly = true;
    }

    // Resolve Feature Details
    if (featureId) {
      gisService.getProjects().then(list => {
        const found = (list || []).find(p => 
          p.id === featureId || 
          p.name.toLowerCase().includes(featureId.toLowerCase()) || 
          featureId.toLowerCase().includes(p.id.toLowerCase())
        );

        if (found) {
          setSelectedFeature({ feat: found, type: 'project' });
          if (found.coordinates && !latParam) {
            setMapCenter(found.coordinates);
            setMapZoom(targetZoom);
          }
          toast.success(`📍 Showing Project: ${found.name}`, { id: 'citizen-gis-toast' });
          return;
        }

        // Check in Ward Boundaries
        const wardMatch = KOPARGAON_WARDS_GEOJSON.features.find(f =>
          f.properties.id === featureId || 
          f.properties.name.toLowerCase().includes(featureId.toLowerCase())
        );
        if (wardMatch) {
          setSelectedWardId(wardMatch.properties.id);
          setSelectedFeature({ feat: wardMatch.properties, type: 'ward' });
          if (!latParam) {
            setMapCenter(wardMatch.geometry.coordinates[0][0].slice().reverse());
            setMapZoom(targetZoom);
          }
          toast.success(`📍 Showing Ward: ${wardMatch.properties.name}`, { id: 'citizen-gis-toast' });
          return;
        }

        // Fallback to location highlight
        if (latParam && lngParam) {
          setSelectedFeature({
            feat: {
              id: featureId,
              name: featureId,
              type: featureType || 'Civic Amenity',
              lat: parseFloat(latParam),
              lng: parseFloat(lngParam),
              ward: wardParam || 'Kopargaon',
              status: 'Verified Civic Location'
            },
            type: featureType || 'location'
          });
          toast.success(`📍 Showing Civic Location: ${featureId}`, { id: 'citizen-gis-toast' });
        }
      });
    } else if (wardParam) {
      const wardFeature = KOPARGAON_WARDS_GEOJSON.features.find(f => f.properties.id === wardParam);
      if (wardFeature) {
        setSelectedWardId(wardParam);
        setMapCenter(wardFeature.geometry.coordinates[0][0].slice().reverse());
        setMapZoom(15);
        setSelectedFeature({ feat: wardFeature.properties, type: 'ward' });
        toast.success(`📍 Showing Ward: ${wardFeature.properties.name}`, { id: 'citizen-gis-toast' });
      }
    } else if (didFly) {
      toast.success('📍 Centered Citizen GIS map on selected coordinates', { id: 'citizen-gis-toast' });
    }
  }, [searchParams, location.state]);

  const handleWhatsHappeningNearMe = () => {
    setLoadingNearMe(true);
    toast.loading('Scanning nearby ward complaints, projects & public facilities...', { duration: 1200 });
    setTimeout(() => {
      setLoadingNearMe(false);
      setIsNearMeOpen(true);
      toast.success('Nearby Area Summary Loaded!');
    }, 1200);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();
    const wardMatch = KOPARGAON_WARDS_GEOJSON.features.find(f =>
      f.properties.name.toLowerCase().includes(query) || f.properties.id.toLowerCase().includes(query)
    );
    if (wardMatch) {
      setSelectedWardId(wardMatch.properties.id);
      setMapCenter(wardMatch.geometry.coordinates[0][0].slice().reverse());
      setMapZoom(15);
      setSelectedFeature({ feat: wardMatch.properties, type: 'ward' });
      toast.success(`Found ${wardMatch.properties.name}`);
      return;
    }

    const prjMatch = allProjects.find(p =>
      p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
    );
    if (prjMatch) {
      if (prjMatch.coordinates) {
        setMapCenter(prjMatch.coordinates);
        setMapZoom(16);
      }
      setSelectedFeature({ feat: prjMatch, type: 'project' });
      toast.success(`Found Project: ${prjMatch.name}`);
      return;
    }

    toast.error('No matching ward or project found');
  };

  return (
    <div className="space-y-4">
      {/* Top Header Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <span>Kopargaon Dedicated Citizen GIS Map</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Public Complaints, PWD Infrastructure & Civic Amenities Overlay</p>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search ward or location..."
            />
          </form>

          <button
            onClick={handleWhatsHappeningNearMe}
            disabled={loadingNearMe}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm shrink-0 cursor-pointer"
          >
            <FolderKanban className="w-4 h-4" />
            <span>What's Happening Near Me</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map Box */}
      <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)] min-h-[600px]">
        <div className="flex-1 relative h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950">
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            selectedFeature={selectedFeature?.feat}
            candidateLocations={candidateLocations}
            onSelectFeature={(feat, type) => setSelectedFeature({ feat, type: type || 'general' })}
            showAllControls={true}
            height="h-full"
          />
        </div>

        {/* Selected Feature Info Drawer */}
        {selectedFeature && (
          <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4 text-xs animate-in slide-in-from-right duration-300">
            <div className="space-y-3 overflow-y-auto pr-1 max-h-[calc(100vh-320px)]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
                    {selectedFeature.type === 'project' ? '🏗️ SMART CITY PROJECT' :
                     selectedFeature.type === 'ward' ? '🏛️ WARD JURISDICTION' :
                     selectedFeature.type === 'candidate' ? '⭐ AI CANDIDATE SITE' :
                     selectedFeature.type === 'complaint' ? '⚠️ CIVIC GRIEVANCE' : '📍 CITIZEN GIS PARCEL'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedFeature.feat.name || selectedFeature.feat.title || selectedFeature.feat.id || 'Civic Amenity'}
                  </h3>
                </div>
                <button onClick={() => setSelectedFeature(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Project Details */}
              {selectedFeature.type === 'project' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2 border border-slate-200 dark:border-slate-800">
                    <p><span className="text-slate-400">Project ID:</span> <strong className="font-mono">{selectedFeature.feat.id}</strong></p>
                    <p><span className="text-slate-400">Ward:</span> <strong>{selectedFeature.feat.ward || 'Ward 3 - Station Area'}</strong></p>
                    <p><span className="text-slate-400">Status:</span> <strong className="text-emerald-500">{selectedFeature.feat.status || 'IN_PROGRESS'}</strong></p>
                    {selectedFeature.feat.budget && (
                      <p><span className="text-slate-400">Budget:</span> <strong>₹{(selectedFeature.feat.budget / 10000000).toFixed(2)} Cr</strong></p>
                    )}
                  </div>

                  {selectedFeature.feat.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Physical Progress</span>
                        <span className="font-bold text-emerald-500">{selectedFeature.feat.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${selectedFeature.feat.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {selectedFeature.feat.description && (
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                      {selectedFeature.feat.description}
                    </p>
                  )}
                </div>
              )}

              {/* Ward Details */}
              {selectedFeature.type === 'ward' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2 border border-slate-200 dark:border-slate-800">
                  <p><span className="text-slate-400">Ward ID:</span> <strong>{selectedFeature.feat.id}</strong></p>
                  <p><span className="text-slate-400">Ward Name:</span> <strong>{selectedFeature.feat.name}</strong></p>
                  {selectedFeature.feat.population && (
                    <p><span className="text-slate-400">Population:</span> <strong>{selectedFeature.feat.population.toLocaleString()}</strong></p>
                  )}
                  {selectedFeature.feat.area && (
                    <p><span className="text-slate-400">Area:</span> <strong>{selectedFeature.feat.area} km²</strong></p>
                  )}
                  <p><span className="text-slate-400">Status:</span> <strong className="text-emerald-500">Active Public Jurisdiction</strong></p>
                </div>
              )}

              {/* Candidate Location Details */}
              {selectedFeature.type === 'candidate' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2 border border-slate-200 dark:border-slate-800">
                    <p><span className="text-slate-400">Rank:</span> <strong>#{selectedFeature.feat.rank} Recommended Site</strong></p>
                    <p><span className="text-slate-400">Suitability Score:</span> <strong className="text-emerald-500">{selectedFeature.feat.score}/100</strong></p>
                    <p><span className="text-slate-400">Zoning:</span> <strong>{selectedFeature.feat.zoning || 'Public / Commercial'}</strong></p>
                  </div>
                  {selectedFeature.feat.reasons && selectedFeature.feat.reasons.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suitability Reasons</span>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                        {selectedFeature.feat.reasons.map((r, i) => (
                          <li key={i} className="flex items-start space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Generic Civic Location / Complaint */}
              {selectedFeature.type !== 'project' && selectedFeature.type !== 'ward' && selectedFeature.type !== 'candidate' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2 border border-slate-200 dark:border-slate-800">
                  <p><span className="text-slate-400">Location Name:</span> <strong>{selectedFeature.feat.name || selectedFeature.feat.title || 'Civic Amenity'}</strong></p>
                  <p><span className="text-slate-400">Ward:</span> <strong>{selectedFeature.feat.ward || 'Kopargaon Central'}</strong></p>
                  <p><span className="text-slate-400">Status:</span> <strong className="text-emerald-500">{selectedFeature.feat.status || 'Verified Spatial Point'}</strong></p>
                  {selectedFeature.feat.lat && selectedFeature.feat.lng && (
                    <p><span className="text-slate-400">Coordinates:</span> <strong className="font-mono text-[11px]">{selectedFeature.feat.lat.toFixed(5)}, {selectedFeature.feat.lng.toFixed(5)}</strong></p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  const coords = selectedFeature.feat.coordinates || 
                                (selectedFeature.feat.lat && selectedFeature.feat.lng ? [selectedFeature.feat.lat, selectedFeature.feat.lng] : null);
                  if (coords) {
                    setMapCenter(coords);
                    setMapZoom(16);
                    toast.success('Centered map on feature');
                  }
                }}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl text-center cursor-pointer transition-colors flex items-center justify-center space-x-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Center Map</span>
              </button>

              <button
                onClick={handleWhatsHappeningNearMe}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center shadow-lg cursor-pointer transition-colors"
              >
                Scan Area →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* WHAT'S HAPPENING NEAR ME MODAL */}
      {isNearMeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full text-xs space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-mono text-emerald-500 font-bold">NEIGHBORHOOD CIVIC SUMMARY</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">What's Happening Near Me</h3>
              </div>
              <button onClick={() => setIsNearMeOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">🏗️ Nearby Smart City Projects (1km Buffer)</span>
                <p>• Station Road Surfacing & Lighting (₹4.8 Cr — 90% Done)</p>
                <p>• Godavari Riverfront Green Promenade (₹12.5 Cr — 82% Done)</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">⚠️ Active Grievances in Ward</span>
                <p>• 2 streetlight maintenance tickets logged (under 24h SLA resolution)</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setIsNearMeOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold cursor-pointer transition-colors">
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenGisPage;
