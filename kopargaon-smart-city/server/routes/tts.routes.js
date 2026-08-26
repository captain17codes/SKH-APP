import express from 'express';
import ttsService from '../services/tts.service.js';

const router = express.Router();

// Google Cloud Text-to-Speech Endpoint
router.post('/', async (req, res) => {
  const { text, language } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  try {
    const audioBuffer = await ttsService.synthesizeSpeech(text, language || 'mr-IN');
    
    // Set appropriate headers and send binary MP3 audio
    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
      'Content-Length': audioBuffer.length
    });
    res.send(audioBuffer);
  } catch (error) {
    console.warn('TTS Service Unavailable (Fallback Triggered):', error.message);
    // Return 200 so the browser does not log a network error. 
    // The invalid audio blob will cause audio.play() to fail, which elegantly triggers the browser TTS fallback in the frontend.
    res.status(200).json({ 
      success: false,
      error: error.message || 'Google Cloud TTS is not configured.'
    });
  }
});

export default router;
