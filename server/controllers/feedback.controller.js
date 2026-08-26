import { createFeedback, getFeedbackByProject, getAverageRating } from '../models/feedback.model.js';

// @desc    Submit feedback for a project/ward
// @route   POST /api/feedback
export const submitFeedback = async (req, res, next) => {
  try {
    const { ward_id, project_id, rating, comment } = req.body;
    const citizen_id = req.user ? req.user.id : null; // Optional citizen auth

    if (!rating) {
      return res.status(400).json({ success: false, message: 'Rating is required' });
    }

    const feedback = await createFeedback({
      ward_id,
      project_id,
      rating,
      comment,
      citizen_id
    });

    res.status(201).json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

// @desc    Get feedback for a specific project
// @route   GET /api/feedback/project/:projectId
export const getProjectFeedback = async (req, res, next) => {
  try {
    const feedback = await getFeedbackByProject(req.params.projectId);
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

// @desc    Get average city-wide feedback rating
// @route   GET /api/feedback/stats
export const getFeedbackStats = async (req, res, next) => {
  try {
    const avg = await getAverageRating();
    res.status(200).json({ success: true, data: { average_rating: avg } });
  } catch (error) {
    next(error);
  }
};
