import express from 'express';
import { blackoutDbService } from '../services/blackoutDbService.js';

const router = express.Router();

router.get('/status', (req, res) => {
  const result = blackoutDbService.getStatus();
  res.json(result);
});

router.post('/simulate-blackout', (req, res) => {
  const success = blackoutDbService.simulateBlackout();
  if (success) {
    res.json({ success: true, message: 'Primary storage wiped.' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to simulate blackout.' });
  }
});

router.post('/outbox', (req, res) => {
  const { payload } = req.body;
  const id = blackoutDbService.submitOutbox(payload);
  if (id) {
    res.json({ id, message: 'SAFE IN RECOVERY OUTBOX' });
  } else {
    res.status(500).json({ message: 'Failed to save to outbox.' });
  }
});

router.post('/recover', (req, res) => {
  const result = blackoutDbService.recover();
  if (result) {
    res.json({ success: true, result });
  } else {
    res.status(500).json({ success: false, message: 'Recovery failed.' });
  }
});

router.post('/reset-demo', (req, res) => {
  const success = blackoutDbService.resetDemo();
  res.json({ success });
});

export default router;
