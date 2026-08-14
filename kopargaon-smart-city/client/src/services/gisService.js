import apiClient from './api';
import KOPARGAON_WARDS_GEOJSON from '../data/gis/wardBoundaries';
import LAND_USE_ZONING_GEOJSON from '../data/gis/landUse';
import INFRASTRUCTURE_GIS_DATA from '../data/gis/infrastructure';
import ROADS_GEOJSON from '../data/gis/roads';
import BUILDINGS_GEOJSON from '../data/gis/buildings';
import { MOCK_PROJECTS } from '../data/mockData';

// Reusable GeoJSON Schema Validation Helper
const validateGeoJSON = (geojson, typeName) => {
  if (!geojson || typeof geojson !== 'object') {
    console.warn(`[GIS Validation Warning] Invalid ${typeName} GeoJSON: Not an object`);
    return { type: 'FeatureCollection', features: [] };
  }
  if (geojson.type !== 'FeatureCollection') {
    console.warn(`[GIS Validation Warning] Invalid ${typeName} GeoJSON: type must be FeatureCollection`);
    return { type: 'FeatureCollection', features: [] };
  }
  if (!Array.isArray(geojson.features)) {
    console.warn(`[GIS Validation Warning] Invalid ${typeName} GeoJSON: features must be an array`);
    return { type: 'FeatureCollection', features: [] };
  }

  const ids = new Set();
  const validFeatures = [];

  for (const feature of geojson.features) {
    if (!feature || typeof feature !== 'object') {
      console.warn(`[GIS Validation Warning] Invalid feature skipped in ${typeName}`);
      continue;
    }
    if (!feature.geometry || typeof feature.geometry !== 'object' || !feature.geometry.type) {
      console.warn(`[GIS Validation Warning] Skipping feature in ${typeName}: missing valid geometry structure`);
      continue;
    }
    if (!Array.isArray(feature.geometry.coordinates)) {
      console.warn(`[GIS Validation Warning] Skipping feature in ${typeName}: coordinates must be an array`);
      continue;
    }

    const properties = feature.properties || {};
    const id = properties.id || feature.id || `gen-${Math.random().toString(36).substr(2, 9)}`;
    
    if (ids.has(id)) {
      console.warn(`[GIS Validation Warning] Skipping feature in ${typeName}: Duplicate ID detected: ${id}`);
      continue;
    }
    
    ids.add(id);
    validFeatures.push({
      ...feature,
      properties: {
        ...properties,
        id // guarantee ID availability in properties
      }
    });
  }

  return {
    ...geojson,
    features: validFeatures
  };
};

export const gisService = {
  getWards: async () => {
    try {
      const res = await apiClient.get('/gis/wards');
      return res.data;
    } catch {
      return KOPARGAON_WARDS_GEOJSON;
    }
  },

  getLandUse: async () => {
    try {
      const res = await apiClient.get('/gis/land-use');
      return res.data;
    } catch {
      return LAND_USE_ZONING_GEOJSON;
    }
  },

  getInfrastructure: async () => {
    try {
      const res = await apiClient.get('/gis/infrastructure');
      return res.data;
    } catch {
      return INFRASTRUCTURE_GIS_DATA;
    }
  },

  getRoads: async () => {
    try {
      const res = await apiClient.get('/gis/roads');
      return res.data;
    } catch {
      return ROADS_GEOJSON;
    }
  },

  getBuildings: async () => {
    try {
      const res = await apiClient.get('/gis/buildings');
      return res.data;
    } catch {
      return BUILDINGS_GEOJSON;
    }
  },

  getProjects: async () => {
    try {
      const res = await apiClient.get('/gis/projects');
      return res.data;
    } catch {
      return MOCK_PROJECTS;
    }
  },

  // --------------------------------------------------
  // REUSABLE GEOJSON LOADERS (POSTGRESQL READY)
  // --------------------------------------------------

  loadWardsGeoJSON: async () => {
    const rawData = await gisService.getWards();
    return validateGeoJSON(rawData, 'Wards');
  },

  loadLandUseGeoJSON: async () => {
    const rawData = await gisService.getLandUse();
    return validateGeoJSON(rawData, 'Land Use');
  },

  loadProjectsGeoJSON: async () => {
    try {
      const projectsList = await gisService.getProjects();
      const geojson = {
        type: 'FeatureCollection',
        features: projectsList.map(prj => {
          // Check if custom geometry exists, otherwise generate Point geometry from coordinates
          const geometry = prj.geometry || {
            type: 'Point',
            coordinates: prj.coordinates && prj.coordinates.length === 2 
              ? [prj.coordinates[1], prj.coordinates[0]] // Swap to [longitude, latitude] for GeoJSON
              : [74.4760, 19.8820]
          };

          return {
            type: 'Feature',
            geometry,
            properties: {
              id: prj.id,
              name: prj.name,
              category: prj.category,
              description: prj.description,
              status: prj.status,
              progress: prj.progress,
              budget: prj.budget,
              spent: prj.spent,
              startDate: prj.startDate,
              expectedCompletion: prj.endDate || prj.expectedCompletion,
              department: prj.department,
              ward: prj.ward
            }
          };
        })
      };
      return validateGeoJSON(geojson, 'Projects');
    } catch (e) {
      console.error('Failed to load projects GeoJSON', e);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  getLayersConfig: async () => {
    try {
      const res = await apiClient.get('/gis/layers');
      return res.data;
    } catch {
      return {
        wards: true,
        roads: true,
        buildings: true,
        landUse: true,
        schools: true,
        hospitals: true,
        governmentLand: true,
        agriculturalLand: true,
        waterPipeline: true,
        drainage: true,
        electricity: true,
        smartProjects: true,
        floodRisk: true
      };
    }
  }
};

export default gisService;
