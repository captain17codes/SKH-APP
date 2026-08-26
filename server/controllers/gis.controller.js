import { getAllWards, getWardById, getAllInfrastructure, getAllRoads } from '../models/gis.model.js';
import { getAllLandUse, getLandStatsByWard, getFragmentationIndex } from '../models/land.model.js';

// @desc    Get all wards with geometry
// @route   GET /api/gis/wards
export const getWards = async (req, res, next) => {
  try {
    const wards = await getAllWards();
    
    // Transform to GeoJSON FeatureCollection with normalized property names
    const featureCollection = {
      type: 'FeatureCollection',
      features: wards.map(w => ({
        type: 'Feature',
        properties: {
          id: w.id,
          ward_number: w.ward_number,
          name: w.name,
          councillor: w.councillor,
          population: w.population || 0,
          areaKm2: parseFloat(w.area_km2) || 0,
          density: w.density,
          type: w.type,
          completionRate: w.completion_rate || 0,
          activeProjects: 0, // Will be computed when project data is joined
          complaintsCount: 0, // Will be computed when complaint data is joined
          color: w.color || '#3b82f6',
          data_source: w.data_source
        },
        geometry: w.geojson
      }))
    };

    res.status(200).json(featureCollection);
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific ward details
// @route   GET /api/gis/wards/:id
export const getWard = async (req, res, next) => {
  try {
    const ward = await getWardById(req.params.id);
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }
    
    const feature = {
      type: 'Feature',
      properties: ward,
      geometry: ward.geojson
    };
    delete feature.properties.geojson;

    res.status(200).json(feature);
  } catch (error) {
    next(error);
  }
};

// @desc    Get infrastructure points (filtering by ward optional)
// @route   GET /api/gis/infrastructure
export const getInfrastructure = async (req, res, next) => {
  try {
    const wardId = req.query.ward_id;
    const infra = await getAllInfrastructure(wardId);
    
    const featureCollection = {
      type: 'FeatureCollection',
      features: infra.map(i => ({
        type: 'Feature',
        properties: i,
        geometry: i.geojson
      }))
    };
    featureCollection.features.forEach(f => delete f.properties.geojson);

    res.status(200).json(featureCollection);
  } catch (error) {
    next(error);
  }
};

// @desc    Get roads
// @route   GET /api/gis/roads
export const getRoads = async (req, res, next) => {
  try {
    const roads = await getAllRoads();
    
    const featureCollection = {
      type: 'FeatureCollection',
      features: roads.map(r => ({
        type: 'Feature',
        properties: r,
        geometry: r.geojson
      }))
    };
    featureCollection.features.forEach(f => delete f.properties.geojson);

    res.status(200).json(featureCollection);
  } catch (error) {
    next(error);
  }
};

// @desc    Get land use polygons
// @route   GET /api/gis/land-use
export const getLandUse = async (req, res, next) => {
  try {
    const wardId = req.query.ward_id;
    const landUse = await getAllLandUse(wardId);
    
    const featureCollection = {
      type: 'FeatureCollection',
      features: landUse.map(lu => ({
        type: 'Feature',
        properties: lu,
        geometry: lu.geojson
      }))
    };
    featureCollection.features.forEach(f => delete f.properties.geojson);

    res.status(200).json(featureCollection);
  } catch (error) {
    next(error);
  }
};

// @desc    Get land use stats for a ward
// @route   GET /api/gis/wards/:id/land-stats
export const getWardLandStats = async (req, res, next) => {
  try {
    const wardId = req.params.id;
    const stats = await getLandStatsByWard(wardId);
    const fragmentation = await getFragmentationIndex(wardId);
    
    res.status(200).json({
      success: true,
      stats,
      fragmentation
    });
  } catch (error) {
    next(error);
  }
};
