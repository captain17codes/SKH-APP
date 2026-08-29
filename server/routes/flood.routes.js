import express from 'express';
import { 
  getScenarios, 
  getSummary, 
  getFacilityElevations, 
  getWaterFeatures,
  getBuildings
} from '../controllers/flood.controller.js';

const router = express.Router();

// GET /api/flood/scenarios
router.get('/scenarios', getScenarios);

// GET /api/flood/summary
router.get('/summary', getSummary);

// GET /api/flood/facility-elevations
router.get('/facility-elevations', getFacilityElevations);

// GET /api/flood/water-features (Note: we'll mount this either under /api/flood or /api/gis in app.js, let's keep it here and mount as needed)
router.get('/water-features', getWaterFeatures);

// GET /api/flood/buildings
router.get('/buildings', getBuildings);

export default router;
