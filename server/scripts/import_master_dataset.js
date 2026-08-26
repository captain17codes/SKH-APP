import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATASET_PATH = path.resolve(__dirname, '../../kopargaon_master_dataset_v3.json');

const fail = (message) => {
  throw new Error(`Master dataset validation failed: ${message}`);
};

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const asNullableText = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
};

const getFeatureKey = (properties) => (
  asNullableText(properties.id) ||
  asNullableText(properties.source_id) ||
  asNullableText(properties['@id'])
);

const createDatasetId = (dataset) => {
  const cityName = asNullableText(dataset.city?.name);
  const version = asNullableText(dataset.version);

  if (!cityName || !version) {
    fail('city.name and version are required.');
  }

  const citySlug = cityName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${citySlug}-master-${version}`;
};

const createAoiGeometry = (analysisAoi) => {
  if (!isRecord(analysisAoi) || !Array.isArray(analysisAoi.bbox) || analysisAoi.bbox.length !== 4) {
    fail('analysis_aoi.bbox must contain west, south, east, and north coordinates.');
  }

  const [west, south, east, north] = analysisAoi.bbox.map(Number);
  if (![west, south, east, north].every(Number.isFinite) || west >= east || south >= north) {
    fail('analysis_aoi.bbox contains invalid coordinate bounds.');
  }

  return {
    type: 'Polygon',
    coordinates: [[
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south]
    ]]
  };
};

const validateDataset = (dataset) => {
  if (!isRecord(dataset)) fail('document must be a JSON object.');
  if (!asNullableText(dataset.dataset_name)) fail('dataset_name is required.');
  if (!isRecord(dataset.city) || !asNullableText(dataset.city.name)) fail('city.name is required.');
  if (!isRecord(dataset.layers)) fail('layers must be an object.');
  if (!isRecord(dataset.layer_catalog)) fail('layer_catalog must be an object.');

  const aoiGeometry = createAoiGeometry(dataset.analysis_aoi);
  const normalizedFeatures = [];
  const layerCounts = new Map();

  for (const [layerName, collection] of Object.entries(dataset.layers)) {
    if (!isRecord(collection) || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
      fail(`layers.${layerName} must be a GeoJSON FeatureCollection.`);
    }

    const expectedCount = dataset.layer_catalog[layerName]?.feature_count;
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      fail(`layer_catalog.${layerName}.feature_count must be a non-negative integer.`);
    }
    if (collection.features.length !== expectedCount) {
      fail(`layers.${layerName} contains ${collection.features.length} features; expected ${expectedCount}.`);
    }

    const featureKeys = new Set();
    for (const [index, feature] of collection.features.entries()) {
      if (!isRecord(feature) || feature.type !== 'Feature') {
        fail(`layers.${layerName}.features[${index}] must be a GeoJSON Feature.`);
      }
      if (!isRecord(feature.geometry) || !asNullableText(feature.geometry.type) || !Array.isArray(feature.geometry.coordinates)) {
        fail(`layers.${layerName}.features[${index}] has no usable geometry.`);
      }
      if (!isRecord(feature.properties)) {
        fail(`layers.${layerName}.features[${index}] has no properties object.`);
      }

      const featureKey = getFeatureKey(feature.properties);
      if (!featureKey) {
        fail(`layers.${layerName}.features[${index}] has no stable id, source_id, or @id.`);
      }
      if (featureKeys.has(featureKey)) {
        fail(`layers.${layerName} contains duplicate source feature key ${featureKey}.`);
      }

      featureKeys.add(featureKey);
      normalizedFeatures.push({
        layerName,
        featureKey,
        geometry: feature.geometry,
        properties: feature.properties
      });
    }

    layerCounts.set(layerName, collection.features.length);
  }

  for (const layerName of Object.keys(dataset.layer_catalog)) {
    if (!Object.hasOwn(dataset.layers, layerName)) {
      fail(`layer_catalog.${layerName} has no matching layer data.`);
    }
  }

  return { aoiGeometry, normalizedFeatures, layerCounts };
};

const formatLayerCounts = (layerCounts) => (
  [...layerCounts.entries()]
    .map(([layerName, count]) => `${layerName}: ${count}`)
    .join(', ')
);

const loadDataset = (datasetPath) => {
  const rawDataset = fs.readFileSync(datasetPath, 'utf8');
  const dataset = JSON.parse(rawDataset);
  const validation = validateDataset(dataset);

  return {
    dataset,
    ...validation,
    checksum: createHash('sha256').update(rawDataset).digest('hex')
  };
};

const getInputPath = () => {
  const fileArgument = process.argv.find((argument) => argument.startsWith('--file='));
  return fileArgument ? path.resolve(process.cwd(), fileArgument.slice('--file='.length)) : DEFAULT_DATASET_PATH;
};

const isDryRun = process.argv.includes('--dry-run');

const importDataset = async ({ dataset, aoiGeometry, normalizedFeatures, layerCounts, checksum, inputPath }) => {
  const datasetId = createDatasetId(dataset);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `
        INSERT INTO master_gis_datasets (
          dataset_id, dataset_name, version, generated_at, city, analysis_aoi,
          layer_catalog, metadata, source_file, source_checksum, imported_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5::jsonb, ST_SetSRID(ST_GeomFromGeoJSON($6), 4326),
          $7::jsonb, $8::jsonb, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (dataset_id) DO UPDATE SET
          dataset_name = EXCLUDED.dataset_name,
          version = EXCLUDED.version,
          generated_at = EXCLUDED.generated_at,
          city = EXCLUDED.city,
          analysis_aoi = EXCLUDED.analysis_aoi,
          layer_catalog = EXCLUDED.layer_catalog,
          metadata = EXCLUDED.metadata,
          source_file = EXCLUDED.source_file,
          source_checksum = EXCLUDED.source_checksum,
          imported_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        datasetId,
        dataset.dataset_name,
        dataset.version,
        dataset.generated_at || null,
        JSON.stringify(dataset.city),
        JSON.stringify(aoiGeometry),
        JSON.stringify(dataset.layer_catalog),
        JSON.stringify({
          analysis_aoi: dataset.analysis_aoi,
          architecture: dataset.architecture,
          planning_evidence: dataset.planning_evidence,
          analysis_capabilities: dataset.analysis_capabilities,
          data_quality: dataset.data_quality,
          data_gaps: dataset.data_gaps,
          decision_use: dataset.decision_use,
          attribution: dataset.attribution,
          provenance_notes: dataset.provenance_notes,
          maplibre_usage: dataset.maplibre_usage
        }),
        path.basename(inputPath),
        checksum
      ]
    );

    // This dataset-specific refresh leaves all existing app/demo GIS tables untouched.
    await client.query('DELETE FROM master_gis_features WHERE dataset_id = $1', [datasetId]);

    for (const feature of normalizedFeatures) {
      await client.query(
        `
          INSERT INTO master_gis_features (
            dataset_id, layer_name, feature_key, name, category, source,
            source_license, municipal_verified, properties, geometry, imported_at, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb,
            ST_SetSRID(ST_GeomFromGeoJSON($10), 4326), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `,
        [
          datasetId,
          feature.layerName,
          feature.featureKey,
          asNullableText(feature.properties.name),
          asNullableText(feature.properties.category),
          asNullableText(feature.properties.source),
          asNullableText(feature.properties.source_license),
          typeof feature.properties.municipal_verified === 'boolean' ? feature.properties.municipal_verified : null,
          JSON.stringify(feature.properties),
          JSON.stringify(feature.geometry)
        ]
      );
    }

    const countResult = await client.query(
      `
        SELECT
          layer_name,
          COUNT(*)::int AS feature_count,
          COUNT(*) FILTER (WHERE ST_SRID(geometry) <> 4326)::int AS invalid_srid_count
        FROM master_gis_features
        WHERE dataset_id = $1
        GROUP BY layer_name
        ORDER BY layer_name
      `,
      [datasetId]
    );

    const importedCounts = new Map(
      countResult.rows.map((row) => [row.layer_name, Number(row.feature_count)])
    );
    const invalidSridCount = countResult.rows.reduce(
      (total, row) => total + Number(row.invalid_srid_count),
      0
    );

    if (invalidSridCount > 0) {
      throw new Error(`Post-import validation failed: ${invalidSridCount} geometries do not use SRID 4326.`);
    }
    if (importedCounts.size !== layerCounts.size) {
      throw new Error('Post-import validation failed: one or more layers are missing.');
    }
    for (const [layerName, expectedCount] of layerCounts.entries()) {
      if (importedCounts.get(layerName) !== expectedCount) {
        throw new Error(
          `Post-import validation failed: ${layerName} has ${importedCounts.get(layerName) || 0} rows; expected ${expectedCount}.`
        );
      }
    }

    const manifestResult = await client.query(
      `
        SELECT dataset_id, version, source_checksum
        FROM master_gis_datasets
        WHERE dataset_id = $1
      `,
      [datasetId]
    );
    const manifest = manifestResult.rows[0];
    if (!manifest || manifest.version !== dataset.version || manifest.source_checksum !== checksum) {
      throw new Error('Post-import validation failed: dataset manifest does not match the imported document.');
    }

    await client.query('COMMIT');

    console.log(`Imported ${normalizedFeatures.length} features into ${datasetId}.`);
    console.log(`Layer counts: ${formatLayerCounts(layerCounts)}`);
    console.log(`Checksum: ${checksum}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const run = async () => {
  const inputPath = getInputPath();

  try {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Dataset file not found: ${inputPath}`);
    }

    const importData = {
      ...loadDataset(inputPath),
      inputPath
    };
    const totalFeatures = importData.normalizedFeatures.length;

    console.log(`Validated ${totalFeatures} features from ${path.basename(inputPath)}.`);
    console.log(`Layer counts: ${formatLayerCounts(importData.layerCounts)}`);
    console.log(`Checksum: ${importData.checksum}`);

    if (isDryRun) {
      console.log('Dry run complete. No database connection or write was performed.');
      return;
    }

    await importDataset(importData);
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error(`Master dataset import failed: ${error.message}`);
  process.exitCode = 1;
});
