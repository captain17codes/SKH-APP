import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-load and cache the JSON files into memory on server start
let scenariosCache = null;
let summaryCache = null;
let elevationsCache = null;
let waterFeaturesCache = null;
let buildingsCache = null;

const toPositiveNumber = (value) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const stableHash = (value) => {
  let hash = 0;
  for (const character of String(value)) {
    hash = ((hash << 5) - hash + character.charCodeAt(0)) >>> 0;
  }
  return hash;
};

const resolveBuildingHeight = (feature, index) => {
  const properties = feature?.properties || {};
  const explicitHeight = toPositiveNumber(
    properties.height_m ?? properties.height ?? properties['building:height']
  );

  if (explicitHeight !== null) {
    return { height_m: explicitHeight, height_source: 'source_height' };
  }

  const levels = toPositiveNumber(properties['building:levels'] ?? properties.levels);
  if (levels !== null) {
    return { height_m: levels * 3, height_source: 'building_levels' };
  }

  const buildingType = String(properties.building || '').toLowerCase();
  const officeType = String(properties.office || '').toLowerCase();
  const amenityType = String(properties.amenity || '').toLowerCase();
  const searchableText = [
    properties.name,
    properties.operator,
    properties.planning_use
  ].filter(Boolean).join(' ').toLowerCase();
  const institutionalTags = [
    'school',
    'college',
    'hospital',
    'university',
    'educational',
    'government',
    'library',
    'cinema',
    'station',
    'municipality',
    'karyalaya'
  ];

  if (
    buildingType === 'school' ||
    officeType ||
    amenityType === 'library' ||
    amenityType === 'cinema' ||
    institutionalTags.some(tag => searchableText.includes(tag))
  ) {
    return { height_m: 10, height_source: 'institutional_tag' };
  }

  if (buildingType === 'commercial') {
    return { height_m: 7, height_source: 'commercial_tag' };
  }

  if (buildingType === 'residential' || buildingType === 'house') {
    return { height_m: 3.5, height_source: 'residential_tag' };
  }

  const distributionBucket = stableHash(feature?.id ?? properties.source_id ?? index) % 100;
  if (distributionBucket < 70) {
    return { height_m: 3.5, height_source: 'deterministic_default_single_storey' };
  }
  if (distributionBucket < 95) {
    return { height_m: 7, height_source: 'deterministic_default_two_storey' };
  }
  return { height_m: 12, height_source: 'deterministic_default_three_storey' };
};

const enrichBuildingHeights = (buildings) => {
  const features = Array.isArray(buildings?.features) ? buildings.features : [];
  const enrichedFeatures = features.map((feature, index) => {
    const resolvedHeight = resolveBuildingHeight(feature, index);
    return {
      ...feature,
      properties: {
        ...(feature.properties || {}),
        ...resolvedHeight
      }
    };
  });

  const heights = enrichedFeatures.map(feature => feature.properties.height_m);
  const counts = enrichedFeatures.reduce((result, feature) => {
    const height = feature.properties.height_m;
    const bucket = `${height}m`;
    result[bucket] = (result[bucket] || 0) + 1;
    return result;
  }, {});
  const average = heights.length
    ? heights.reduce((total, height) => total + height, 0) / heights.length
    : 0;

  console.log(
    '[FLOOD ENGINE] Building metadata samples:',
    JSON.stringify(enrichedFeatures.slice(0, 5).map(feature => ({
      id: feature.id,
      building: feature.properties?.building,
      levels: feature.properties?.['building:levels'],
      category: feature.properties?.category,
      name: feature.properties?.name,
      height_m: feature.properties?.height_m,
      height_source: feature.properties?.height_source
    })))
  );
  console.log('[FLOOD ENGINE] Building height distribution:', JSON.stringify({
    count: heights.length,
    min_m: heights.length ? Math.min(...heights) : 0,
    max_m: heights.length ? Math.max(...heights) : 0,
    average_m: Number(average.toFixed(2)),
    counts
  }));

  return {
    ...buildings,
    features: enrichedFeatures
  };
};

const loadData = () => {
  try {
    const basePath = path.join(__dirname, '../../kopargaon_digital_twin_ready');
    
    // 1. Scenarios
    const scenariosPath = path.join(basePath, 'data/scenarios/godavari_preliminary_flood_scenarios.geojson');
    if (fs.existsSync(scenariosPath)) {
      scenariosCache = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'));
      console.log('[FLOOD ENGINE] Loaded Godavari precomputed flood scenarios.');
    } else {
      console.error('[FLOOD ENGINE] Missing scenarios file:', scenariosPath);
    }

    // 2. Summary
    const summaryPath = path.join(basePath, 'data/derived/kopargaon_flood_twin_summary.json');
    if (fs.existsSync(summaryPath)) {
      summaryCache = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      console.log('[FLOOD ENGINE] Loaded flood twin summary.');
    } else {
      console.error('[FLOOD ENGINE] Missing summary file:', summaryPath);
    }

    // 3. Elevations
    const elevationsPath = path.join(basePath, 'data/derived/kopargaon_facility_elevations.json');
    if (fs.existsSync(elevationsPath)) {
      elevationsCache = JSON.parse(fs.readFileSync(elevationsPath, 'utf-8'));
      console.log('[FLOOD ENGINE] Loaded facility elevations.');
    } else {
      console.error('[FLOOD ENGINE] Missing elevations file:', elevationsPath);
    }

    // 4. Water Features from Master Dataset (extract water_bodies and waterways)
    const masterPath = path.join(basePath, 'data/as_is/kopargaon_master_dataset.json');
    if (fs.existsSync(masterPath)) {
      const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));
      waterFeaturesCache = {
        water_bodies: masterData.layers?.water_bodies || { type: 'FeatureCollection', features: [] },
        waterways: masterData.layers?.waterways || { type: 'FeatureCollection', features: [] }
      };
      buildingsCache = enrichBuildingHeights(masterData.layers?.buildings || {
        type: 'FeatureCollection',
        features: []
      });
      console.log('[FLOOD ENGINE] Extracted water features and enriched building heights from master dataset.');
    } else {
      console.error('[FLOOD ENGINE] Missing master dataset file:', masterPath);
    }
  } catch (error) {
    console.error('[FLOOD ENGINE] Error loading precomputed data:', error);
  }
};

// Initialize the data load immediately
loadData();

export const getScenarios = (req, res) => {
  if (!scenariosCache) {
    return res.status(500).json({ error: 'Flood scenarios data not available on server.' });
  }
  res.json(scenariosCache);
};

export const getSummary = (req, res) => {
  if (!summaryCache) {
    return res.status(500).json({ error: 'Flood summary data not available on server.' });
  }
  res.json(summaryCache);
};

export const getFacilityElevations = (req, res) => {
  if (!elevationsCache) {
    return res.status(500).json({ error: 'Facility elevations data not available on server.' });
  }
  res.json(elevationsCache);
};

export const getWaterFeatures = (req, res) => {
  if (!waterFeaturesCache) {
    return res.status(500).json({ error: 'Water features data not available on server.' });
  }
  res.json(waterFeaturesCache);
};

export const getBuildings = (req, res) => {
  if (!buildingsCache) {
    return res.status(500).json({ error: 'Buildings data not available on server.' });
  }
  res.json(buildingsCache);
};
