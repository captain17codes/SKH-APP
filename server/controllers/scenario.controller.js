import {
  createScenario,
  getScenarios,
  getScenarioById,
  updateScenarioStatus,
  deleteScenario
} from '../models/scenario.model.js';

// @desc    Create a new WHAT-IF scenario
// @route   POST /api/scenarios
export const createNewScenario = async (req, res, next) => {
  try {
    const { name, scenario_type, description, geometry } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!name || !scenario_type || !geometry) {
      return res.status(400).json({ success: false, message: 'Name, scenario_type, and geometry are required' });
    }

    const scenario = await createScenario({
      name,
      scenario_type,
      description,
      geometry,
      created_by: userId
    });

    res.status(201).json({ success: true, data: scenario });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all scenarios
// @route   GET /api/scenarios
export const getAllScenarios = async (req, res, next) => {
  try {
    const { status } = req.query;
    const scenarios = await getScenarios(status);
    res.status(200).json({ success: true, data: scenarios });
  } catch (error) {
    next(error);
  }
};

// @desc    Get scenario by ID
// @route   GET /api/scenarios/:id
export const getScenarioDetails = async (req, res, next) => {
  try {
    const scenario = await getScenarioById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }
    res.status(200).json({ success: true, data: scenario });
  } catch (error) {
    next(error);
  }
};

// @desc    Update scenario status
// @route   PATCH /api/scenarios/:id/status
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const userId = req.user ? req.user.id : null;
    const role = req.user ? req.user.role : 'ADMIN';

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updated = await updateScenarioStatus(req.params.id, status, userId, role);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete scenario
// @route   DELETE /api/scenarios/:id
export const removeScenario = async (req, res, next) => {
  try {
    const deleted = await deleteScenario(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
