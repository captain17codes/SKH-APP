import express from 'express';
import projectController from '../controllers/project.controller.js';
import { getProjectMilestones, addMilestone, editMilestone, removeMilestone } from '../controllers/milestone.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/overview', projectController.getOverview);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.get('/:id/risk', projectController.getProjectRisk);

// Protected routes (Admin / Officers only)
router.post('/', protect, authorize('Admin', 'Officer'), projectController.createProject);
router.put('/:id', protect, authorize('Admin', 'Officer'), projectController.updateProject);
router.delete('/:id', protect, authorize('Admin'), projectController.deleteProject);

// Milestone routes
router.get('/:id/milestones', getProjectMilestones);
router.post('/:id/milestones', protect, authorize('Admin', 'Officer'), addMilestone);
router.patch('/milestones/:id', protect, authorize('Admin', 'Officer'), editMilestone);
router.delete('/milestones/:id', protect, authorize('Admin'), removeMilestone);

export default router;
