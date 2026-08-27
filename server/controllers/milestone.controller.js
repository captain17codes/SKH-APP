import {
  getMilestonesByProject,
  createMilestone,
  updateMilestone,
  deleteMilestone
} from '../models/milestone.model.js';

// @desc    Get milestones for a project
// @route   GET /api/projects/:id/milestones
export const getProjectMilestones = async (req, res, next) => {
  try {
    const milestones = await getMilestonesByProject(req.params.id);
    res.status(200).json({ success: true, data: milestones });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a milestone to a project
// @route   POST /api/projects/:id/milestones
export const addMilestone = async (req, res, next) => {
  try {
    const { name, target_date } = req.body;
    const project_id = req.params.id;

    if (!name || !target_date) {
      return res.status(400).json({ success: false, message: 'Name and target_date are required' });
    }

    const milestone = await createMilestone({
      project_id,
      name,
      target_date
    });

    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a milestone
// @route   PATCH /api/projects/milestones/:id
export const editMilestone = async (req, res, next) => {
  try {
    const { status, completion_date, evidence_notes } = req.body;
    
    const updated = await updateMilestone(req.params.id, {
      status,
      completion_date,
      evidence_notes
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Milestone not found or no changes provided' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a milestone
// @route   DELETE /api/projects/milestones/:id
export const removeMilestone = async (req, res, next) => {
  try {
    const deleted = await deleteMilestone(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
