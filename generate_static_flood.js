import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  return {
    ...buildings,
    features: enrichedFeatures
  };
};

const basePath = path.join(__dirname, 'kopargaon_digital_twin_ready');
const outPath = path.join(__dirname, 'client/public/data/flood');

if (!fs.existsSync(outPath)) {
  fs.mkdirSync(outPath, { recursive: true });
}

// 1. Scenarios
const scenariosPath = path.join(basePath, 'data/scenarios/godavari_preliminary_flood_scenarios.geojson');
let scenariosCache = null;
if (fs.existsSync(scenariosPath)) {
  scenariosCache = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'));
  fs.writeFileSync(path.join(outPath, 'scenarios.json'), JSON.stringify(scenariosCache));
  console.log('Saved scenarios.json');
}

// 2. Summary
const summaryPath = path.join(basePath, 'data/derived/kopargaon_flood_twin_summary.json');
if (fs.existsSync(summaryPath)) {
  const summaryCache = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  fs.writeFileSync(path.join(outPath, 'summary.json'), JSON.stringify(summaryCache));
  console.log('Saved summary.json');
}

// 3. Elevations
const elevationsPath = path.join(basePath, 'data/derived/kopargaon_facility_elevations.json');
if (fs.existsSync(elevationsPath)) {
  const elevationsCache = JSON.parse(fs.readFileSync(elevationsPath, 'utf-8'));
  fs.writeFileSync(path.join(outPath, 'facility-elevations.json'), JSON.stringify(elevationsCache));
  console.log('Saved facility-elevations.json');
}

// 4. Water Features and Buildings
const masterPath = path.join(basePath, 'data/as_is/kopargaon_master_dataset.json');
if (fs.existsSync(masterPath)) {
  const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));
  const waterFeaturesCache = {
    water_bodies: masterData.layers?.water_bodies || { type: 'FeatureCollection', features: [] },
    waterways: masterData.layers?.waterways || { type: 'FeatureCollection', features: [] }
  };
  fs.writeFileSync(path.join(outPath, 'water-features.json'), JSON.stringify(waterFeaturesCache));
  console.log('Saved water-features.json');

  const buildingsCache = enrichBuildingHeights(masterData.layers?.buildings || {
    type: 'FeatureCollection',
    features: []
  });
  fs.writeFileSync(path.join(outPath, 'buildings.json'), JSON.stringify(buildingsCache));
  console.log('Saved buildings.json');
}
