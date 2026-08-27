import express from 'express';
import {
  createNewScenario,
  getAllScenarios,
  getScenarioDetails,
  updateStatus,
  removeScenario
} from '../controllers/scenario.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getAllScenarios)
  .post(protect, createNewScenario);

router.route('/:id')
  .get(getScenarioDetails)
  .delete(protect, removeScenario);

router.route('/:id/status')
  .patch(protect, updateStatus);

export default router;
