import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Map, { 
  Source, 
  Layer, 
  Marker, 
  Popup, 
  NavigationControl, 
  FullscreenControl 
} from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Use CDN worker URL to ensure reliable loading in Vercel production builds
// where hashed chunk filenames from ?url imports can fail to resolve.
maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@6.6.0/dist/maplibre-gl-worker.js');
import { KOPARGAON_CENTER, DEFAULT_ZOOM } from '../../data/mockData';
import { gisService } from '../../services/gisService';
import { projectService } from '../../services/api';
import MapLayerControl from './MapLayerControl';
import MapTools from './MapTools';
import MapPopup from './MapPopup';
import MapLegend from './MapLegend';
import turfService from '../../services/turfService';
import { area as turfArea } from '@turf/turf';

const COMPLAINT_PRIORITY_COLORS = {
  CRITICAL: '#f43f5e',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#10b981'
};

const CustomMarker = ({ color, size = 14, isSelected = false }) => (
  <div 
    style={{
      backgroundColor: color,
      width: isSelected ? size + 6 : size,
      height: isSelected ? size + 6 : size,
      borderRadius: '50%',
      border: isSelected ? '3px solid white' : '2px solid white',
      boxShadow: `0 0 10px ${color}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    }}
  />
);

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
  complaintHotspots = null,
  flat = false  // flat=true → 2D top-down view (GIS page); flat=false → 3D pitched view (Scenario page)
}) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: center[1] || 74.4760,
    latitude: center[0] || 19.8820,
    zoom: zoom || 13,
    pitch: flat ? 0 : 60,  // 0° = flat 2D top-down; 60° = 3D tilted
    bearing: 0
  });

  const [wardsData, setWardsData] = useState(null);
  const [landUseData, setLandUseData] = useState(null);
  const [roadsData, setRoadsData] = useState(null);
  const [buildingsData, setBuildingsData] = useState(null);
  const [infraData, setInfraData] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [floodFeatures, setFloodFeatures] = useState(null);
  const [waterFeatures, setWaterFeatures] = useState(null);
  
  const [hoveredWardId, setHoveredWardId] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);

  const [baseTileSource, setBaseTileSource] = useState('osm');
  const [overlayMode, setOverlayMode] = useState('none');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapError, setMapError] = useState(null);

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
    floodRisk: false,
    complaintHotspots: true,
    cadastralPlots: true
  });

  // Load Data
  useEffect(() => {
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

    import('../../data/flood/scenarios.json').then(m => {
      const highest = m.default.features.find(f => Number(f.properties?.relative_rise_m) === 3);
      if (highest) {
        setFloodFeatures({ type: 'FeatureCollection', features: [highest] });
      }
    }).catch(console.error);

    import('../../data/flood/water-features.json').then(m => {
      setWaterFeatures(m.default);
    }).catch(console.error);
  }, []);

  // Helper to extract bounds from any GeoJSON feature collection
  const getGeoJSONBounds = useCallback((geojson) => {
    if (!geojson) return null;
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    const processCoords = (coords) => {
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const [lng, lat] = coords;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else if (Array.isArray(coords)) {
        coords.forEach(processCoords);
      }
    };
    const features = geojson.features || (Array.isArray(geojson) ? geojson : [geojson]);
    features.forEach(f => {
      if (f.geometry && f.geometry.coordinates) {
        processCoords(f.geometry.coordinates);
      }
    });
    if (minLng === Infinity) return null;
    return [[minLng, minLat], [maxLng, maxLat]];
  }, []);

  // Guarded camera navigation: executes ONLY ONCE when a new feature is explicitly selected
  const lastFlownFeatureIdRef = useRef(null);
  useEffect(() => {
    if (!selectedFeature) return;
    const feat = selectedFeature.feat || selectedFeature;
    const featKey = `${feat.id || feat.name || ''}_${feat.lat || ''}_${feat.lng || ''}`;
    if (!featKey || lastFlownFeatureIdRef.current === featKey) return;
    lastFlownFeatureIdRef.current = featKey;

    const featId = String(feat.id || '').toLowerCase();
    const featName = String(feat.name || '').toLowerCase();
    const featType = String(selectedFeature.type || feat.type || '').toLowerCase();

    const isFlood = featId.includes('godavari') || 
                    featName.includes('godavari') || 
                    featName.includes('flood') || 
                    featType.includes('flood') || 
                    featId.includes('river');

    if (isFlood) {
      setActiveLayers(prev => ({ ...prev, floodRisk: true }));
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [74.4835, 19.8764],
          zoom: 15,
          duration: 1200
        });
      }
    } else {
      const coords = feat.coordinates || (feat.lat && feat.lng ? [feat.lat, feat.lng] : null);
      if (coords && mapRef.current) {
        mapRef.current.flyTo({
          center: [coords[1], coords[0]], // [lng, lat]
          zoom: 16,
          duration: 1200
        });
      }
    }
  }, [selectedFeature]);

  // Fullscreen support
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleLayer = (layerId) => setActiveLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }));

  // Dynamic Ward Style based on Overlay Mode
  const wardFillColor = useMemo(() => {
    if (overlayMode === 'project-density') {
      return [
        'step', ['get', 'activeProjects'],
        '#3b82f6', 3, '#f59e0b', 5, '#ef4444'
      ];
    } else if (overlayMode === 'complaint-density') {
      return [
        'step', ['get', 'complaintsCount'],
        '#10b981', 5, '#fb923c', 9, '#f43f5e'
      ];
    } else if (overlayMode === 'development-progress') {
      return [
        'step', ['get', 'completionRate'],
        '#f59e0b', 71, '#3b82f6', 81, '#10b981'
      ];
    }
    return ['coalesce', ['get', 'color'], '#3b82f6'];
  }, [overlayMode]);

  // MapLibre Layer Definitions
  // flat=true → flat 2D fill; flat=false → 3D fill-extrusion
  const wardLayerStyle = useMemo(() => {
    if (flat) {
      // 2D flat mode: simple fill polygon with hover/select highlights
      return {
        id: 'wards-fill',
        type: 'fill',
        paint: {
          'fill-color': selectedWardId
            ? ['case', ['==', ['get', 'id'], selectedWardId], '#60a5fa', wardFillColor]
            : wardFillColor,
          'fill-opacity': hoveredWardId
            ? ['case', ['==', ['get', 'id'], hoveredWardId], 0.75, 0.45]
            : 0.45,
          'fill-outline-color': '#94a3b8'
        }
      };
    }
    // 3D extrusion mode (default for Scenario page)
    return {
      id: 'wards-fill',
      type: 'fill-extrusion',
      paint: {
        'fill-extrusion-color': selectedWardId 
          ? [
              'case',
              ['==', ['get', 'id'], selectedWardId], '#60a5fa',
              wardFillColor
            ]
          : wardFillColor,
        'fill-extrusion-height': [
          'interpolate', ['linear'], 
          ['coalesce', ['get', 'population'], 5000],
          0, 50,
          5000, 150,
          10000, 300,
          20000, 500
        ],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': hoveredWardId
          ? [
              'case',
              ['==', ['get', 'id'], hoveredWardId], 0.85,
              0.6
            ]
          : 0.6
      }
    };
  }, [flat, selectedWardId, hoveredWardId, wardFillColor]);

  const landUseLayerStyle = {
    id: 'land-use-fill',
    type: 'fill',
    paint: {
      'fill-color': ['coalesce', ['get', 'color'], '#10b981'],
      'fill-opacity': 0.35,
      'fill-outline-color': '#059669'
    }
  };

  const roadLayerStyle = {
    id: 'roads-line',
    type: 'line',
    paint: {
      'line-color': '#475569',
      'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 16, 4]
    }
  };

  const buildingLayerStyle = {
    id: 'buildings-fill',
    type: 'fill-extrusion',
    paint: {
      'fill-extrusion-color': '#8b5cf6',
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['coalesce', ['get', 'floors'], 1],
        1, 3.5,
        10, 35
      ],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.8
    }
  };

  const handleMapClick = (event) => {
    const { features, lngLat } = event;
    const clickedFeature = features && features[0];
    
    if (clickedFeature && clickedFeature.layer.id === 'wards-fill') {
      if (onSelectFeature) {
        // Turf.js dynamic area calculation
        const calculatedAreaSqm = turfArea(clickedFeature.geometry);
        const calculatedAreaSqKm = (calculatedAreaSqm / 1000000).toFixed(2);
        
        const enhancedProperties = {
          ...clickedFeature.properties,
          calculatedAreaSqKm: calculatedAreaSqKm
        };
        onSelectFeature(enhancedProperties, 'ward');
      }
    } else if (clickedFeature && clickedFeature.layer.id === 'cadastral-fill') {
      if (onSelectFeature) onSelectFeature(clickedFeature.properties, 'cadastral');
      setPopupInfo({ type: 'cadastral', data: clickedFeature.properties, lngLat: [lngLat.lng, lngLat.lat] });
    } else {
      // Turf.js Point-in-Polygon check example when clicking an empty spot
      if (wardsData) {
        const wardProp = turfService.getWardFromPoint(lngLat.lng, lngLat.lat, wardsData);
        if (wardProp && onSelectFeature) {
          console.log(`[Turf.js] Pin dropped in ${wardProp.name}`);
        }
      }
    }
  };

  const handleMapHover = (event) => {
    const { features } = event;
    const hoveredFeature = features && features.find(f => f.layer.id === 'wards-fill');
    setHoveredWardId(hoveredFeature ? hoveredFeature.properties.id : null);
  };

  const mapStyleUrl = useMemo(() => {
    if (baseTileSource === 'satellite') {
      return {
        version: 8,
        sources: {
          'basemap-raster': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '&copy; Esri'
          }
        },
        layers: [
          {
            id: 'basemap-raster-layer',
            type: 'raster',
            source: 'basemap-raster',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      };
    }
    
    // Default street map using OSM raster tiles (since 'osm' is explicitly requested by state)
    // CartoCDN Voyager now requires an API key and returns 403, causing white map.
    return {
      version: 8,
      sources: {
        'osm': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap Contributors'
        }
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    };
  }, [baseTileSource]);

  const displayHospitals = (osmData?.hospitals && osmData.hospitals.length > 0) ? osmData.hospitals : (infraData?.hospitals || []);
  const displaySchools = (osmData?.schools && osmData.schools.length > 0) ? osmData.schools : (infraData?.schools || []);

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };
  const toggleSatellite = () => {
    setBaseTileSource(prev => prev === 'osm' ? 'satellite' : 'osm');
  };

  return (
    <div ref={containerRef} className={`flex flex-col md:flex-row w-full bg-surface ${height} ${isFullscreen ? 'fixed inset-0 z-50 h-screen rounded-none' : ''}`} style={{ minHeight: '500px' }}>
      
      {showAllControls && (
        <div className="w-full md:w-72 flex-shrink-0 flex flex-col border-r border-outline-variant bg-surface overflow-hidden">
          {/* Top horizontal tools (Zoom + Satellite) */}
          <MapTools
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onToggleSatellite={toggleSatellite}
            isSatellite={baseTileSource === 'satellite'}
          />
          
          {/* Scrollable middle area for Layers */}
          <div className="flex-1 overflow-y-auto">
            <MapLayerControl
              activeLayers={activeLayers}
              onToggleLayer={toggleLayer}
            />
          </div>

          {/* Bottom fixed area for Legend */}
          <div className="border-t border-outline-variant flex-shrink-0">
            <MapLegend />
          </div>
        </div>
      )}

      {/* Actual Map Container */}
      <div className="flex-1 relative w-full h-full min-h-[600px]">
        {mapError && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-surface/90 backdrop-blur-sm">
            <div className="bg-error-container text-on-error-container p-6 rounded-xl shadow-lg max-w-md text-center border border-error/20">
              <span className="material-symbols-outlined text-[40px] mb-2 text-error">broken_image</span>
              <h3 className="font-title-lg mb-2">3D Map Engine Error</h3>
              <p className="font-body-md text-on-error-container/80 mb-4">
                {mapError.message || String(mapError)}
              </p>
              <button 
                onClick={() => setMapError(null)} 
                className="px-4 py-2 bg-error text-on-error rounded hover:opacity-90 font-label-md"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => {
            setViewState(evt.viewState);
            if (onZoomChange) onZoomChange(evt.viewState.zoom);
            if (onCenterChange) onCenterChange([evt.viewState.latitude, evt.viewState.longitude]);
          }}
          onClick={handleMapClick}
          onMouseMove={handleMapHover}
          onError={e => {
            console.error('[MapLibre Error]', e);
            if (e.error) setMapError(e.error);
          }}
          interactiveLayerIds={['wards-fill', 'cadastral-fill']}
          mapStyle={mapStyleUrl}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%', height: '100%', minHeight: '600px' }}
        >
          <FullscreenControl position="top-right" />

        {/* Wards Source & Layer (3D Extrusion) */}
        {activeLayers.wards && wardsData && (
          <Source id="wards-source" type="geojson" data={wardsData}>
            <Layer {...wardLayerStyle} />
          </Source>
        )}

        {/* Land Use Layer */}
        {activeLayers.landUse && landUseData && (
          <Source id="landuse-source" type="geojson" data={landUseData}>
            <Layer {...landUseLayerStyle} />
          </Source>
        )}

        {/* River Water Bodies (Solid Natural Godavari River) */}
        {waterFeatures?.water_bodies && (
          <Source id="river-water-bodies-source" type="geojson" data={waterFeatures.water_bodies}>
            <Layer
              id="river-water-bodies-layer"
              type="fill"
              paint={{
                'fill-color': '#1d4ed8', // Vibrant solid river blue
                'fill-opacity': 0.85,
                'fill-outline-color': '#1e40af'
              }}
            />
          </Source>
        )}

        {/* River Waterways (Connected River Flowlines) */}
        {waterFeatures?.waterways && (
          <Source id="river-waterways-source" type="geojson" data={waterFeatures.waterways}>
            <Layer
              id="river-waterways-layer"
              type="line"
              paint={{
                'line-color': '#2563eb',
                'line-width': 3.5,
                'line-opacity': 0.95
              }}
            />
          </Source>
        )}

        {/* Flood Extent Overlay (Semi-transparent Blue extending from the river) */}
        {activeLayers.floodRisk && floodFeatures && (
          <Source id="flood-extent-source" type="geojson" data={floodFeatures}>
            <Layer
              id="flood-extent-layer"
              type="fill"
              paint={{
                'fill-color': '#60a5fa', // Semi-transparent lighter water blue
                'fill-opacity': 0.45,
                'fill-outline-color': '#3b82f6'
              }}
            />
            <Layer
              id="flood-extent-outline"
              type="line"
              paint={{
                'line-color': '#2563eb',
                'line-width': 1.5,
                'line-dasharray': [3, 2],
                'line-opacity': 0.75
              }}
            />
          </Source>
        )}

        {/* Roads Layer (Rendered Above Water) */}
        {activeLayers.roads && roadsData && (
          <Source id="roads-source" type="geojson" data={roadsData}>
            <Layer {...roadLayerStyle} />
          </Source>
        )}

        {/* Buildings Layer (Rendered Above Water) */}
        {activeLayers.buildings && buildingsData && (
          <Source id="buildings-source" type="geojson" data={buildingsData}>
            <Layer {...buildingLayerStyle} />
          </Source>
        )}

        {/* Cadastral Plots Layer (Vector Tiles from PostGIS) */}
        {activeLayers.cadastralPlots && (!!import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) && (
          <Source 
            id="cadastral-source" 
            type="vector" 
            tiles={[`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/gis/tiles/land_plots/{z}/{x}/{y}.pbf`]}
          >
            <Layer 
              id="cadastral-fill" 
              type="fill" 
              source-layer="kopargaon_cadastral"
              paint={{
                'fill-color': [
                  'match',
                  ['get', 'category'],
                  'Residential', '#fcd34d',
                  'Commercial', '#f87171',
                  'Agricultural', '#86efac',
                  'Government/Public', '#93c5fd',
                  '#cbd5e1'
                ],
                'fill-opacity': 0.6,
                'fill-outline-color': '#475569'
              }} 
            />
            <Layer 
              id="cadastral-line" 
              type="line" 
              source-layer="kopargaon_cadastral"
              paint={{
                'line-color': '#1e293b',
                'line-width': 1,
                'line-opacity': 0.8
              }} 
            />
          </Source>
        )}

        {/* Hospitals Markers */}
        {activeLayers.hospitals && displayHospitals.map(h => (
          <Marker 
            key={h.id} 
            longitude={h.lng} 
            latitude={h.lat}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo({ type: 'hospital', data: h, lngLat: [h.lng, h.lat] });
              if (onSelectFeature) onSelectFeature(h, 'hospital');
            }}
          >
            <CustomMarker color="#e11d48" isSelected={selectedFeature?.feat?.id === h.id} />
          </Marker>
        ))}

        {/* Schools Markers */}
        {activeLayers.schools && displaySchools.map(s => (
          <Marker 
            key={s.id} 
            longitude={s.lng} 
            latitude={s.lat}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo({ type: 'school', data: s, lngLat: [s.lng, s.lat] });
              if (onSelectFeature) onSelectFeature(s, 'school');
            }}
          >
            <CustomMarker color="#2563eb" isSelected={selectedFeature?.feat?.id === s.id} />
          </Marker>
        ))}

        {/* Smart Projects Markers */}
        {activeLayers.smartProjects && projectsList.map(prj => {
          if (!prj.coordinates || !Array.isArray(prj.coordinates) || prj.coordinates.length < 2) return null;
          const riskLevel = (prj.aiRisk || prj.riskAnalysis?.risk || 'UNKNOWN').toUpperCase();
          let riskColor = '#10b981';
          if (riskLevel === 'CRITICAL') riskColor = '#a855f7';
          else if (riskLevel === 'HIGH') riskColor = '#ef4444';
          else if (riskLevel === 'MEDIUM') riskColor = '#f59e0b';
          else if (riskLevel === 'UNKNOWN') riskColor = '#94a3b8';

          return (
            <Marker 
              key={prj.id} 
              longitude={prj.coordinates[1]} 
              latitude={prj.coordinates[0]}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setPopupInfo({ type: 'project', data: prj, lngLat: [prj.coordinates[1], prj.coordinates[0]] });
                if (onSelectFeature) onSelectFeature(prj, 'project');
              }}
            >
              <CustomMarker color={riskColor} size={18} isSelected={selectedFeature?.feat?.id === prj.id} />
            </Marker>
          );
        })}

        {/* Complaint Hotspots Markers */}
        {activeLayers.complaintHotspots && complaintHotspots && complaintHotspots.features && complaintHotspots.features.map(feat => {
          const p = feat.properties;
          const coords = feat.geometry?.coordinates;
          if (!coords || coords.length < 2) return null;
          const markerColor = COMPLAINT_PRIORITY_COLORS[p.priority] || '#f59e0b';
          return (
            <Marker 
              key={`complaint-${p.id}`} 
              longitude={coords[0]} 
              latitude={coords[1]}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setPopupInfo({ 
                  type: 'complaint', 
                  data: { ...p, lat: coords[1], lng: coords[0] }, 
                  lngLat: [coords[0], coords[1]] 
                });
                if (onSelectFeature) onSelectFeature({ ...p, lat: coords[1], lng: coords[0] }, 'complaint');
              }}
            >
              <CustomMarker color={markerColor} size={14} isSelected={selectedFeature?.feat?.id === p.id} />
            </Marker>
          );
        })}

        {/* Dynamic Hazard Buffer from Turf.js (If a critical complaint is selected) */}
        {selectedFeature && selectedFeature.type === 'complaint' && selectedFeature.feat.priority === 'CRITICAL' && (
          <Source 
            id="hazard-buffer" 
            type="geojson" 
            data={turfService.generateHazardBuffer(selectedFeature.feat.lng, selectedFeature.feat.lat, 0.5)}
          >
            <Layer 
              id="hazard-buffer-fill" 
              type="fill" 
              paint={{
                'fill-color': '#ef4444',
                'fill-opacity': 0.3
              }} 
            />
            <Layer 
              id="hazard-buffer-line" 
              type="line" 
              paint={{
                'line-color': '#ef4444',
                'line-width': 2,
                'line-dasharray': [2, 2]
              }} 
            />
          </Source>
        )}

        {/* Popups */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.lngLat[0]}
            latitude={popupInfo.lngLat[1]}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            maxWidth="300px"
          >
            <MapPopup data={popupInfo.data} type={popupInfo.type} />
          </Popup>
        )}
      </Map>
      </div>
    </div>
  );
};

export default MapView;
