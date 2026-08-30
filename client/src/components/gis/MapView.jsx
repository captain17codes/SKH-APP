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
  complaintHotspots = null
}) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: center[1] || 74.4760,
    latitude: center[0] || 19.8820,
    zoom: zoom || 13,
    pitch: 60,
    bearing: 0
  });

  const [wardsData, setWardsData] = useState(null);
  const [landUseData, setLandUseData] = useState(null);
  const [roadsData, setRoadsData] = useState(null);
  const [buildingsData, setBuildingsData] = useState(null);
  const [infraData, setInfraData] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  
  const [hoveredWardId, setHoveredWardId] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);

  const [baseTileSource, setBaseTileSource] = useState('osm');
  const [overlayMode, setOverlayMode] = useState('none');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
  }, []);

  // FlyTo effect for selected feature or center prop
  useEffect(() => {
    if (mapRef.current) {
      if (selectedFeature && selectedFeature.coordinates) {
        mapRef.current.flyTo({
          center: [selectedFeature.coordinates[1], selectedFeature.coordinates[0]], // [lng, lat]
          zoom: 16,
          pitch: 65,
          bearing: -20,
          duration: 2000
        });
      } else if (center && center.length === 2) {
        mapRef.current.flyTo({
          center: [center[1], center[0]],
          zoom: zoom || 13,
          duration: 1000
        });
      }
    }
  }, [selectedFeature, center, zoom]);

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
  const wardLayerStyle = useMemo(() => ({
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
  }), [selectedWardId, hoveredWardId, wardFillColor]);

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
    
    // Default street map using Carto Voyager (reliable vector style)
    return 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
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
      <div className="flex-1 relative w-full h-full min-h-[400px]">
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
          interactiveLayerIds={['wards-fill', 'cadastral-fill']}
          mapStyle={mapStyleUrl}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%', height: '100%' }}
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

        {/* Roads Layer (Mock Data) */}
        {activeLayers.roads && roadsData && (
          <Source id="roads-source" type="geojson" data={roadsData}>
            <Layer {...roadLayerStyle} />
          </Source>
        )}

        {/* Buildings Layer */}
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
