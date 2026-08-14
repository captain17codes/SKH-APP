import express from 'express';
import projectController from '../controllers/project.controller.js';

const router = express.Router();

router.get('/overview', projectController.getOverview);
router.get('/', projectController.getAllProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProjectById);
router.get('/:id/risk', projectController.getProjectRisk);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
