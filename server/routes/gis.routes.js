import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Helper to load GeoJSON from file with fallback
const loadGeoJsonFile = (filename) => {
  const possiblePaths = [
    path.join(__dirname, '../../client/src/data/gis', filename),
    path.join(__dirname, '../data/gis', filename),
    path.join(__dirname, '../../database', filename)
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      } catch (err) {}
    }
  }
  return { type: 'FeatureCollection', features: [] };
};

// 1. /api/gis/wards
router.get('/wards', (req, res) => {
  const data = loadGeoJsonFile('wards.geojson');
  res.json(data);
});

// 2. /api/gis/land-use
router.get('/land-use', (req, res) => {
  const data = loadGeoJsonFile('land_use.geojson');
  res.json(data);
});

// 3. /api/gis/infrastructure
router.get('/infrastructure', (req, res) => {
  const data = loadGeoJsonFile('infrastructure.geojson');
  res.json(data);
});

// 4. /api/gis/roads
router.get('/roads', (req, res) => {
  const data = loadGeoJsonFile('roads.geojson');
  res.json(data);
});

// 5. /api/gis/buildings
router.get('/buildings', (req, res) => {
  const data = loadGeoJsonFile('buildings.geojson') || { type: 'FeatureCollection', features: [] };
  res.json(data);
});

// 6. /api/gis/projects
router.get('/projects', (req, res) => {
  const data = loadGeoJsonFile('projects.geojson');
  res.json(data);
});

// 7. /api/gis/layers
router.get('/layers', (req, res) => {
  res.json({
    wards: loadGeoJsonFile('wards.geojson'),
    landUse: loadGeoJsonFile('land_use.geojson'),
    infrastructure: loadGeoJsonFile('infrastructure.geojson'),
    roads: loadGeoJsonFile('roads.geojson'),
    projects: loadGeoJsonFile('projects.geojson')
  });
});

export default router;
