import { 
  getDashboardMetrics, 
  getProjectStatusDistribution, 
  getComplaintCategoryDistribution 
} from '../models/analytics.model.js';

// @desc    Get high-level dashboard metrics
// @route   GET /api/analytics/metrics
export const getMetrics = async (req, res, next) => {
  try {
    const metrics = await getDashboardMetrics();
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project status breakdown
// @route   GET /api/analytics/projects
export const getProjectStats = async (req, res, next) => {
  try {
    const data = await getProjectStatusDistribution();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint category breakdown
// @route   GET /api/analytics/complaints
export const getComplaintStats = async (req, res, next) => {
  try {
    const data = await getComplaintCategoryDistribution();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
