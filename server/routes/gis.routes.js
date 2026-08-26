import express from 'express';
import { 
  getWards, 
  getWard, 
  getInfrastructure, 
  getRoads, 
  getLandUse,
  getWardLandStats,
  getLandPlotTiles
} from '../controllers/gis.controller.js';

const router = express.Router();

// Base GIS endpoints for map rendering
router.get('/wards', getWards);
router.get('/wards/:id', getWard);
router.get('/wards/:id/land-stats', getWardLandStats);
router.get('/infrastructure', getInfrastructure);
router.get('/roads', getRoads);
router.get('/land-use', getLandUse);

// Dynamic Vector Tiles endpoint
router.get('/tiles/land_plots/:z/:x/:y.pbf', getLandPlotTiles);

export default router;
