import express from 'express';
import {
  getAllProperties,
  getPropertiesMap,
  getPropertyById,
  createProperty,
  updatePropertyStatus,
  submitInquiry,
  getMyProperties
} from '../controllers/property.controller.js';

const router = express.Router();

// GET  /api/properties/map
router.get('/map', getPropertiesMap);

// GET  /api/properties/my-listings/:sellerId
router.get('/my-listings/:sellerId', getMyProperties);

// GET  /api/properties
router.get('/', getAllProperties);

// GET  /api/properties/:id
router.get('/:id', getPropertyById);

// POST /api/properties
router.post('/', createProperty);

// PATCH /api/properties/:id/status (Admin verification)
router.patch('/:id/status', updatePropertyStatus);

// POST /api/properties/:id/inquiry
router.post('/:id/inquiry', submitInquiry);

export default router;
