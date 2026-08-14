import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Polyline,
  Rectangle,
  CircleMarker,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KOPARGAON_CENTER, DEFAULT_ZOOM } from '../../data/mockData';
import { gisService } from '../../services/gisService';
import { projectService } from '../../services/api';
import MapLayerControl from './MapLayerControl';
import MapTools from './MapTools';
import MapPopup from './MapPopup';
import MapLegend from './MapLegend';
import { loadMappls } from '../../utils/mapplsLoader';
// Fix Leaflet Default Icon Paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon Generator
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  const prevTargetRef = useRef(null);

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      const isNew = !prevTargetRef.current ||
                    prevTargetRef.current[0] !== center[0] ||
                    prevTargetRef.current[1] !== center[1] ||
                    prevTargetRef.current[2] !== zoom;
      if (isNew) {
        prevTargetRef.current = [...center, zoom];
        map.flyTo(center, zoom || 14, {
          animate: true,
          duration: 1.5
        });
      }
    }
  }, [center, zoom, map]);

  useEffect(() => {
    const handleResize = () => {
      if (map) map.invalidateSize();
    };

    handleResize();
    const t1 = setTimeout(handleResize, 150);
    const t2 = setTimeout(handleResize, 450);

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
};

// Removes the default Leaflet scale bar that appears bottom-left
const RemoveScaleControl = () => {
  const map = useMap();
  useEffect(() => {
    map.eachLayer(() => {});
    map.eachControl = map.eachControl || (() => {});
    map._controlContainer && map._controlContainer
      .querySelectorAll('.leaflet-control-scale')
      .forEach(el => el.remove());
  }, [map]);
  return null;
};

const MapInstanceRegistrar = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

const MapEventsHandler = ({ onZoomChange, onCenterChange }) => {
  const map = useMapEvents({
    zoomend() {
      if (onZoomChange) onZoomChange(map.getZoom());
    },
    dragend() {
      if (onCenterChange) {
        const c = map.getCenter();
        onCenterChange([c.lat, c.lng]);
      }
    }
  });
  return null;
};

const COMPLAINT_PRIORITY_COLORS = {
  CRITICAL: '#f43f5e',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#10b981'
};

const MapView = ({
  center = KOPARGAON_CENTER,
  zoom = DEFAULT_ZOOM,
  selectedWardId = null,
  onSelectFeature = null,
  selectedFeature = null,
  showAllControls = true,
  height = "h-[650px]",
  onZoomChange = null,
  onCenterChange = null,
  osmData = null,
  candidateLocations = [],
  complaintHotspots = null
}) => {
  const initialCenterRef = useRef(center || KOPARGAON_CENTER);
  const initialZoomRef = useRef(zoom || DEFAULT_ZOOM);

  const [wardsData, setWardsData] = useState(null);
  const [landUseData, setLandUseData] = useState(null);
  const [roadsData, setRoadsData] = useState(null);
  const [buildingsData, setBuildingsData] = useState(null);
  const [infraData, setInfraData] = useState(null);
  const [projectsList, setProjectsList] = useState([]);

  const [baseTileSource, setBaseTileSource] = useState('osm');

  const [activeLayers, setActiveLayers] = useState({
    wards: true,
    landUse: true,
    roads: true,
    buildings: true,
    smartProjects: true,
    hospitals: true,
    schools: true,
    governmentLand: true,
    waterPipeline: true,
    drainage: true,
    electricity: true,
    floodRisk: true,
    complaintHotspots: true
  });

  const [activeTool, setActiveTool] = useState('none'); // kept for compatibility
  const [overlayMode, setOverlayMode] = useState('none');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Browser Fullscreen API handler
  const handleToggleFullscreen = useCallback(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(err => {
        console.warn('[GIS] Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Sync React state + invalidate map size on fullscreen change
  useEffect(() => {
    const onFsChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      requestAnimationFrame(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      });
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 200);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Existing GIS data loading
  const fetchGisData = useCallback(() => {
    gisService.loadWardsGeoJSON().then(setWardsData);
    gisService.loadLandUseGeoJSON().then(setLandUseData);
    projectService.getAll().then(list => {
      if (Array.isArray(list)) {
        const prjList = list.map(p => ({
          ...p,
          coordinates: p.coordinates || (p.geometry?.type === 'Point' ? [p.geometry.coordinates[1], p.geometry.coordinates[0]] : null)
        }));
        setProjectsList(prjList);
      }
    });

    gisService.getRoads().then(setRoadsData);
    gisService.getBuildings().then(setBuildingsData);
    gisService.getInfrastructure().then(setInfraData);
  }, []);

  useEffect(() => {
    fetchGisData();
  }, [fetchGisData]);

  // Refresh GIS / Reset Map View to default center and zoom
  const handleResetView = useCallback(() => {
    setActiveTool('none');

    const defaultCenter = (Array.isArray(initialCenterRef.current) && initialCenterRef.current.length === 2 && !isNaN(initialCenterRef.current[0]) && !isNaN(initialCenterRef.current[1]))
      ? initialCenterRef.current
      : KOPARGAON_CENTER;
    const defaultZoom = initialZoomRef.current || DEFAULT_ZOOM;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(defaultCenter, defaultZoom, {
        animate: true
      });
      mapInstanceRef.current.invalidateSize();
    }

    if (onCenterChange) onCenterChange(defaultCenter);
    if (onZoomChange) onZoomChange(defaultZoom);

    fetchGisData();
  }, [fetchGisData, onCenterChange, onZoomChange]);

  // Pre-load Mappls SDK so tiles and future SDK features are available
  useEffect(() => {
    loadMappls()
      .then(() => {
        console.info('[MapView] Mappls SDK ready – tiles available via baseTileSource "mappls".');
      })
      .catch((err) => {
        console.warn('[MapView] Mappls SDK failed to load, falling back to OSM/Satellite tiles.', err);
        setUseLeafletFallback(true);
      });
  }, []);

  // State for fallback
  const [useLeafletFallback, setUseLeafletFallback] = useState(false);

  const toggleLayer = (layerId) => {
    setActiveLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };


  const isProjectSelected = (id) => selectedFeature && selectedFeature.type === 'project' && selectedFeature.feat.id === id;
  const isSchoolSelected = (id) => selectedFeature && selectedFeature.type === 'school' && selectedFeature.feat.id === id;
  const isHospitalSelected = (id) => selectedFeature && selectedFeature.type === 'hospital' && selectedFeature.feat.id === id;
  const isRoadSelected = (id) => selectedFeature && selectedFeature.type === 'road' && selectedFeature.feat.id === id;

  // Road styling classifications
  const getRoadStyle = (type) => {
    switch (type) {
      case 'motorway':
      case 'trunk':
        return { color: '#dc2626', weight: 5 };
      case 'primary':
        return { color: '#ea580c', weight: 4 };
      case 'secondary':
        return { color: '#eab308', weight: 3 };
      case 'tertiary':
        return { color: '#3b82f6', weight: 2.5 };
      case 'residential':
        return { color: '#94a3b8', weight: 1.5 };
      case 'service':
      case 'unclassified':
      default:
        return { color: '#cbd5e1', weight: 1 };
    }
  };

  // GeoJSON Ward Styling with Hover & Selection Highlight support
  const wardStyle = (feature) => {
    const p = feature.properties;
    const isSelected = selectedWardId && p.id === selectedWardId;

    let fillOpacity = isSelected ? 0.55 : 0.25;
    let fillColor = p.color || '#3b82f6';

    if (overlayMode === 'project-density') {
      fillColor = p.activeProjects > 4 ? '#ef4444' : p.activeProjects > 2 ? '#f59e0b' : '#3b82f6';
      fillOpacity = 0.6;
    } else if (overlayMode === 'complaint-density') {
      fillColor = p.complaintsCount > 8 ? '#f43f5e' : p.complaintsCount > 4 ? '#fb923c' : '#10b981';
      fillOpacity = 0.6;
    } else if (overlayMode === 'development-progress') {
      fillColor = p.completionRate > 80 ? '#10b981' : p.completionRate > 70 ? '#3b82f6' : '#f59e0b';
      fillOpacity = 0.65;
    }

    return {
      fillColor,
      weight: isSelected ? 3.5 : 1.5,
      opacity: 1,
      color: isSelected ? '#ffffff' : '#334155',
      dashArray: isSelected ? '' : '3',
      fillOpacity
    };
  };

  const onEachWard = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.5,
          weight: 3,
          color: '#ffffff'
        });
      },
      mouseout: (e) => {
        const l = e.target;
        const isSelected = selectedWardId && feature.properties.id === selectedWardId;
        l.setStyle({
          fillOpacity: isSelected ? 0.55 : 0.25,
          weight: isSelected ? 3.5 : 1.5,
          color: isSelected ? '#ffffff' : '#334155'
        });
      },
      click: () => {
        if (onSelectFeature) onSelectFeature(feature.properties, 'ward');
      }
    });
  };

  // Land Use Zoning Style
  const landUseStyle = (feature) => {
    return {
      fillColor: feature.properties.color || '#10b981',
      weight: 1.5,
      color: feature.properties.color || '#10b981',
      fillOpacity: 0.35,
      dashArray: '2,4'
    };
  };

  const safeCenter = (Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1]))
    ? center
    : KOPARGAON_CENTER;

  // Progressive Zoom-Level Visibility Checks
  const showRegionLevel = zoom >= 10;
  const showCityLevel = zoom >= 12;
  const showDetailLevel = zoom >= 13;
  const showBuildingLevel = zoom >= 14;

  // Merge Real OSM Data with fallbacks
  const displaySchools = (osmData?.schools && osmData.schools.length > 0)
    ? osmData.schools
    : (infraData?.schools || []);

  const displayHospitals = (osmData?.hospitals && osmData.hospitals.length > 0)
    ? osmData.hospitals
    : (infraData?.hospitals || []);

  const displayRoads = (osmData?.roads && osmData.roads.length > 0)
    ? osmData.roads
    : [];

  return (
    <div
      ref={mapContainerRef}
      className={`relative w-full ${height} ${isFullscreen ? 'fixed inset-0 z-50 h-screen rounded-none' : 'rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800'}`}
      style={{ minHeight: '500px' }}
    >
      {/* Map Tools & Layer Control Overlay */}
      {showAllControls && (
        <>
          <MapTools
            baseTileSource={baseTileSource}
            onChangeBaseTile={setBaseTileSource}
            onResetView={handleResetView}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          <MapLayerControl
            activeLayers={activeLayers}
            onToggleLayer={toggleLayer}
            isOpen={isLayerMenuOpen}
            onToggleOpen={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            overlayMode={overlayMode}
            onSelectOverlayMode={setOverlayMode}
          />

          <MapLegend
            isOpen={isLegendOpen}
            onToggleOpen={() => setIsLegendOpen(!isLegendOpen)}
            overlayMode={overlayMode}
          />
        </>
      )}



      {/* Leaflet Core Container */}
      <MapContainer
        center={safeCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
        keyboard={true}
        className="w-full h-full bg-slate-100 dark:bg-slate-950"
        style={{ height: '100%', minHeight: '500px', width: '100%' }}
        ref={mapInstanceRef}
      >
        <MapInstanceRegistrar onMapReady={(map) => { mapInstanceRef.current = map; }} />
        <RemoveScaleControl />
        <MapRecenter center={safeCenter} zoom={zoom} />
        <MapEventsHandler onZoomChange={onZoomChange} onCenterChange={onCenterChange} />

        {/* Base Map Tile Layer */}
        {baseTileSource === 'satellite' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> World Imagery'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            maxNativeZoom={18}
          />
        ) : baseTileSource === 'mappls' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.mappls.com/">Mappls</a> contributors'
            url={`https://apis.mappls.com/advancedmaps/v1/${import.meta.env.VITE_MAPPLS_API_KEY}/maptile/{z}/{x}/{y}.png`}
            maxZoom={19}
            maxNativeZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            maxNativeZoom={19}
          />
        )}

        {/* Kopargaon GeoJSON Wards Layer */}
        {activeLayers.wards && wardsData && (
          <GeoJSON
            key={`wards-${overlayMode}`}
            data={wardsData}
            style={wardStyle}
            onEachFeature={onEachWard}
          />
        )}

        {/* Land Use Zoning GeoJSON */}
        {activeLayers.landUse && landUseData && showCityLevel && (
          <GeoJSON
            data={landUseData}
            style={landUseStyle}
            onEachFeature={(feat, layer) => {
              layer.on({
                click: () => {
                  if (onSelectFeature) onSelectFeature(feat.properties, 'landUse');
                }
              });
            }}
          />
        )}

        {/* Mock Roads Network GeoJSON */}
        {activeLayers.roads && roadsData && showCityLevel && !displayRoads.length && (
          <GeoJSON
            data={roadsData}
            style={{ color: '#475569', weight: zoom >= 14 ? 4.5 : 2.5 }}
          />
        )}

        {/* Real OSM Roads Network Layer */}
        {activeLayers.roads && showCityLevel && displayRoads.map(rd => {
          const isSelected = isRoadSelected(rd.id);
          return (
            <Polyline
              key={rd.id}
              positions={rd.coordinates}
              pathOptions={{
                ...getRoadStyle(rd.type),
                color: isSelected ? '#3b82f6' : getRoadStyle(rd.type).color,
                weight: isSelected ? getRoadStyle(rd.type).weight + 2.5 : getRoadStyle(rd.type).weight
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectFeature) onSelectFeature(rd, 'road');
                }
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <span className="font-bold block text-blue-600 dark:text-blue-400">{rd.name}</span>
                  <span className="capitalize text-slate-500">Type: {rd.type} | Surface: {rd.surface || 'N/A'}</span>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Buildings GeoJSON */}
        {activeLayers.buildings && buildingsData && showBuildingLevel && (
          <GeoJSON
            data={buildingsData}
            style={{ fillColor: '#8b5cf6', fillOpacity: 0.5, color: '#6d28d9', weight: 1.5 }}
          />
        )}

        {/* Hospitals */}
        {activeLayers.hospitals && showCityLevel && displayHospitals.map(h => {
          const isSelected = isHospitalSelected(h.id);
          return (
            <Marker
              key={h.id}
              position={[h.lat, h.lng]}
              icon={createCustomIcon(isSelected ? '#10b981' : '#e11d48')}
              eventHandlers={{
                click: () => {
                  if (onSelectFeature) onSelectFeature(h, 'hospital');
                }
              }}
            >
              <Popup>
                <MapPopup data={h} type="hospital" />
              </Popup>
            </Marker>
          );
        })}

        {/* Schools */}
        {activeLayers.schools && showCityLevel && displaySchools.map(s => {
          const isSelected = isSchoolSelected(s.id);
          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={createCustomIcon(isSelected ? '#10b981' : '#2563eb')}
              eventHandlers={{
                click: () => {
                  if (onSelectFeature) onSelectFeature(s, 'school');
                }
              }}
            >
              <Popup>
                <MapPopup data={s} type="school" />
              </Popup>
            </Marker>
          );
        })}

        {/* Government Land */}
        {activeLayers.governmentLand && infraData?.governmentLand && showDetailLevel && infraData.governmentLand.map(g => (
          <Marker
            key={g.id}
            position={[g.lat, g.lng]}
            icon={createCustomIcon('#6366f1')}
            eventHandlers={{
              click: () => {
                if (onSelectFeature) onSelectFeature(g, 'land');
              }
            }}
          >
            <Popup>
              <MapPopup data={g} type="land" />
            </Popup>
          </Marker>
        ))}

        {/* Water Pipeline */}
        {activeLayers.waterPipeline && infraData?.waterPipeline && showDetailLevel && infraData.waterPipeline.map(wp => (
          <Polyline key={wp.id} positions={wp.coords} color="#06b6d4" weight={4} dashArray="6,6">
            <Popup>
              <div className="p-1 text-xs text-white">
                <span className="font-bold block text-cyan-400">{wp.name}</span>
                <span>Diameter: {wp.diameter} | Status: {wp.status}</span>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Drainage Network */}
        {activeLayers.drainage && infraData?.drainage && showDetailLevel && infraData.drainage.map(dr => (
          <Polyline key={dr.id} positions={dr.coords} color="#a855f7" weight={3}>
            <Popup>
              <div className="p-1 text-xs text-white">
                <span className="font-bold block text-purple-400">{dr.name}</span>
                <span>Status: {dr.status}</span>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Electricity Sub-stations */}
        {activeLayers.electricity && infraData?.electricity && showDetailLevel && infraData.electricity.map(el => (
          <Marker key={el.id} position={[el.lat, el.lng]} icon={createCustomIcon('#eab308')}>
            <Popup>
              <div className="p-1 text-xs text-white">
                <span className="font-bold text-amber-400 block">{el.name}</span>
                <span>Capacity: {el.capacity} | Status: {el.status}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Flood Risk Zone */}
        {activeLayers.floodRisk && infraData?.floodRisk && showRegionLevel && infraData.floodRisk.map(fr => (
          <Rectangle key={fr.id} bounds={fr.bounds} pathOptions={{ color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.2 }}>
            <Popup>
              <div className="p-1 text-xs text-white">
                <span className="font-bold text-rose-400 block">{fr.name}</span>
                <p className="mt-1">{fr.description}</p>
              </div>
            </Popup>
          </Rectangle>
        ))}

        {/* Smart City Projects Spatial Markers */}
        {activeLayers.smartProjects && showRegionLevel && projectsList.map(prj => {
          if (!prj.coordinates || !Array.isArray(prj.coordinates) || prj.coordinates.length < 2) return null;
          const isSelected = isProjectSelected(prj.id);
          const riskLevel = (prj.aiRisk || prj.riskAnalysis?.risk || 'UNKNOWN').toUpperCase();
          
          let riskColor = '#10b981'; // LOW
          if (riskLevel === 'CRITICAL') riskColor = '#a855f7';
          else if (riskLevel === 'HIGH') riskColor = '#ef4444';
          else if (riskLevel === 'MEDIUM') riskColor = '#f59e0b';
          else if (riskLevel === 'UNKNOWN') riskColor = '#94a3b8';

          return (
            <CircleMarker
              key={prj.id}
              center={prj.coordinates}
              radius={isSelected ? 14 : 9}
              pathOptions={{
                color: isSelected ? '#ffffff' : riskColor,
                fillColor: riskColor,
                fillOpacity: 0.9,
                weight: isSelected ? 3.5 : 2
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectFeature) onSelectFeature(prj, 'project');
                }
              }}
            >
              <Popup>
                <MapPopup data={prj} type="project" />
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Citizen Complaint Hotspots — AI Priority Layer */}
        {activeLayers.complaintHotspots && complaintHotspots && complaintHotspots.features && showRegionLevel && complaintHotspots.features.map(feat => {
          const p = feat.properties;
          const coords = feat.geometry?.coordinates; // GeoJSON [lng, lat]
          if (!coords || coords.length < 2) return null;
          const markerColor = COMPLAINT_PRIORITY_COLORS[p.priority] || '#f59e0b';
          const radius = p.priority === 'CRITICAL' ? 11 : p.priority === 'HIGH' || p.priority === 'High' ? 9 : 7;
          return (
            <CircleMarker
              key={`complaint-${p.id}`}
              center={[coords[1], coords[0]]}
              radius={radius}
              pathOptions={{
                color: '#fff',
                fillColor: markerColor,
                fillOpacity: 0.92,
                weight: 2
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectFeature) onSelectFeature({
                    ...p,
                    lat: coords[1],
                    lng: coords[0]
                  }, 'complaint');
                }
              }}
            >
              <Popup>
                <div className="p-2 text-xs max-w-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{ background: markerColor }} className="inline-block w-2 h-2 rounded-full" />
                    <span className="font-extrabold uppercase text-[9px]" style={{ color: markerColor }}>
                      {p.priority || 'MEDIUM'} PRIORITY
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight mb-1">{p.title}</h4>
                  <p className="text-slate-500 text-[11px] mb-0.5">🏷 {p.category} · {p.ward}</p>
                  <p className="text-slate-500 text-[11px] mb-0.5">📊 AI Score: <strong style={{ color: markerColor }}>{p.aiScore}/100</strong></p>
                  <p className="text-slate-500 text-[11px]">👍 {p.upvotes || 0} upvotes · {p.status}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* AI Recommended Candidate Locations */}
        {candidateLocations && candidateLocations.length > 0 && candidateLocations.map(c => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={createCustomIcon('#10b981')}
            eventHandlers={{
              click: () => {
                if (onSelectFeature) onSelectFeature(c, 'candidate');
              }
            }}
          >
            <Popup>
              <div className="p-2 text-xs max-w-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold uppercase text-[9px] mb-1">
                  Rank #{c.rank} Candidate Site
                </span>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{c.name}</h4>
                <p className="text-slate-500 mb-1">Suitability Score: <span className="font-bold text-emerald-600 dark:text-emerald-400">{c.score}%</span></p>
                <p className="text-slate-500 mb-2">Zoning Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.zoning} ({c.area} Acres)</span></p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      if (onSelectFeature) onSelectFeature(c, 'candidate');
                    }}
                    className="px-2 py-1 bg-blue-600 text-white rounded font-bold cursor-pointer hover:bg-blue-500 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
};

export default MapView;
