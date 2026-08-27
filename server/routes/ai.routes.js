import express from 'express';
import aiService from '../services/ai.service.js';
import mcpClient from '../services/mcpClient.js';

const router = express.Router();

// AI Urban Planner Query Endpoint
router.post('/urban-planner', async (req, res) => {
  const { query, language, role, userType, message, prompt, text } = req.body;
  const queryText = query || message || prompt || text;

  if (!queryText || typeof queryText !== 'string' || !queryText.trim()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Query or message is required',
      response: 'Please provide a valid query or message.',
      answer: 'Please provide a valid query or message.'
    });
  }

  try {
    const activeRole = role || userType || 'citizen';
    const result = await aiService.processPlannerQuery(queryText.trim(), language, activeRole, req.body);
    
    const answer = result.answer || result.text || result.response || result.output || 'No description provided.';
    
    const resolvedLang = result.language || (language && language !== 'auto' ? language : 'mr');
    res.json({
      success: result.success !== undefined ? result.success : true,
      response: answer,
      answer: answer,
      text: answer,
      recommendations: result.recommendations || [],
      mapAction: result.mapAction || null,
      sources: result.sources || [],
      language: resolvedLang
    });
  } catch (e) {
    console.error('Urban Planner API Route Error:', e);
    const targetLang = language || 'en-IN';
    let errorMsg = 'Urban planning analysis failed.';
    if (targetLang === 'mr-IN') {
      errorMsg = 'शहरी नियोजन विश्लेषण अयशस्वी झाले.';
    } else if (targetLang === 'hi-IN') {
      errorMsg = 'शहरी नियोजन विश्लेषण विफल रहा।';
    }
    res.status(500).json({
      success: false,
      error: e.message,
      response: errorMsg,
      answer: errorMsg,
      recommendations: [],
      mapAction: null,
      sources: []
    });
  }
});

// AI Scenario Assessment Endpoint
router.post('/scenario-assessment', async (req, res) => {
  const { scenarioId, name, scenario_type, conflict_count, conflict_details } = req.body;

  try {
    const assessment = await aiService.generateScenarioAssessment(req.body);
    res.json({
      success: true,
      assessment
    });
  } catch (e) {
    console.error('Scenario Assessment API Route Error:', e);
    res.status(500).json({
      success: false,
      error: e.message,
      assessment: 'Unable to generate AI assessment due to a server error.'
    });
  }
});

// AI Urban Planner Health Endpoint
router.get('/urban-planner/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: 'Groq',
    model: 'llama-3.3-70b-versatile'
  });
});

// Legacy Health Endpoint
router.get('/health', async (req, res) => {
  const mcpStatus = await mcpClient.isMcpServerAvailable();
  res.json({
    status: 'ok',
    services: {
      expressServer: 'online',
      mcpServer: mcpStatus ? 'online' : 'offline',
      database: 'connected'
    }
  });
});

export default router;

