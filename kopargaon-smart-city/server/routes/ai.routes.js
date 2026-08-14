import express from 'express';
import aiService from '../services/ai.service.js';
import mcpClient from '../services/mcpClient.js';

const router = express.Router();

// AI Urban Planner Query Endpoint
router.post('/urban-planner', async (req, res) => {
  const { query, language } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  try {
    const result = await aiService.processPlannerQuery(query, language || 'en-IN');
    
    // Ensure the response meets the exact requested structure:
    // { success, answer, recommendations, mapAction, sources }
    res.json({
      success: result.success !== undefined ? result.success : true,
      answer: result.answer || result.text || 'No description provided.',
      recommendations: result.recommendations || [],
      mapAction: result.mapAction || null,
      sources: result.sources || []
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
      answer: errorMsg,
      recommendations: [],
      mapAction: null,
      sources: []
    });
  }
});

// AI Urban Planner Health Endpoint
router.get('/urban-planner/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: 'xAI',
    model: 'grok-4.5'
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
