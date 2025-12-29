// /routes/aiRoutes.js - PRODUCTION ROUTES
import express from 'express';
import {
  analyzeContent,
  batchAnalyze,
  getCachedAIContent
} from '../controllers/aiContentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// 🎯 MAIN AI ANALYSIS ENDPOINT - Handles all 12 features
router.post('/analyze', analyzeContent);

// 🚀 BATCH PROCESSING - Multiple features in one request
router.post('/analyze/batch', batchAnalyze);

// 💾 GET CACHED AI CONTENT
router.get('/cached/:sourceId/:feature', getCachedAIContent);

// ⚡ INDIVIDUAL FEATURE ENDPOINTS (Convenience routes)
router.post('/suggest-tags', (req, res) => {
  req.body.feature = 'suggest-tags';
  return analyzeContent(req, res);
});

router.post('/rewrite-title', (req, res) => {
  req.body.feature = 'rewrite-title';
  return analyzeContent(req, res);
});

router.post('/quality-score', (req, res) => {
  req.body.feature = 'quality-score';
  return analyzeContent(req, res);
});

router.post('/quick-summary', (req, res) => {
  req.body.feature = 'quick-summary';
  return analyzeContent(req, res);
});

router.post('/detect-duplicates', (req, res) => {
  req.body.feature = 'detect-duplicates';
  return analyzeContent(req, res);
});

router.post('/content-type', (req, res) => {
  req.body.feature = 'content-type';
  return analyzeContent(req, res);
});

router.post('/code-review', (req, res) => {
  req.body.feature = 'code-review';
  return analyzeContent(req, res);
});

router.post('/best-answer-summary', (req, res) => {
  req.body.feature = 'best-answer-summary';
  return analyzeContent(req, res);
});

router.post('/enhance-search', (req, res) => {
  req.body.feature = 'enhance-search';
  return analyzeContent(req, res);
});

export default router;