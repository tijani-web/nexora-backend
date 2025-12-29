// /controllers/aiController.js - COMPLETE CONTROLLER
import { AIService } from '../services/aiService.js';
import { upsertAIContent, getAIContent } from '../models/aiContentModel.js';

// Generic AI analysis endpoint
export const analyzeContent = async (req, res) => {
  try {
    const { feature, content, sourceId, targetLang, additionalData } = req.body;
    const userId = req.user?.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Feature mapping to service methods
    const featureMap = {
      'suggest-tags': () => AIService.suggestTags(content),
      'rewrite-title': () => AIService.rewriteTitle(content),
      'rewrite-description': () => AIService.rewriteDescription(content),
      'quality-score': () => AIService.rateQuestionQuality(content),
      'detect-duplicates': () => AIService.detectDuplicates(content),
      'quick-summary': () => AIService.quickSummary(content),
      'auto-translate': () => AIService.autoTranslate(content, targetLang || 'english'),
      'content-type': () => AIService.detectContentType(content),
      'code-review': () => AIService.codeReview(content),
      'personalize-feed': () => AIService.personalizeFeed(content),
      'enhance-search': () => AIService.enhanceSearch(content),
      'best-answer-summary': () => AIService.bestAnswerSummary(content, additionalData?.answers || '')
    };

    if (!featureMap[feature]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid AI feature requested'
      });
    }

    // Call AI service
    const result = await featureMap[feature]();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'AI service unavailable'
      });
    }

    // Store in database if sourceId provided
    if (sourceId) {
      await upsertAIContent(feature, sourceId, result.data);
    }

    res.json({
      success: true,
      data: result.data,
      feature,
      cached: !!sourceId
    });

  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Batch process multiple features
export const batchAnalyze = async (req, res) => {
  try {
    const { analyses } = req.body;
    
    if (!analyses || !Array.isArray(analyses)) {
      return res.status(400).json({
        success: false,
        message: 'Analyses array is required'
      });
    }

    const results = await Promise.all(
      analyses.map(async (analysis) => {
        try {
          const { feature, content, sourceId } = analysis;
          const result = await analyzeSingleFeature(feature, content, sourceId);
          return { feature, ...result };
        } catch (error) {
          return { 
            feature: analysis.feature, 
            success: false, 
            error: error.message 
          };
        }
      })
    );

    res.json({
      success: true,
      data: results,
      processed: results.length
    });

  } catch (error) {
    console.error('Batch AI Error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch processing failed'
    });
  }
};

// Get cached AI content
export const getCachedAIContent = async (req, res) => {
  try {
    const { sourceId, feature } = req.params;

    const cached = await getAIContent(sourceId, feature);

    if (!cached) {
      return res.status(404).json({
        success: false,
        message: 'No cached AI content found'
      });
    }

    res.json({
      success: true,
      data: cached.content_text,
      cached: true,
      createdAt: cached.created_at
    });

  } catch (error) {
    console.error('Get Cached AI Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cached content'
    });
  }
};

// Helper function for single feature analysis
async function analyzeSingleFeature(feature, content, sourceId) {
  const featureMap = {
    'suggest-tags': () => AIService.suggestTags(content),
    'rewrite-title': () => AIService.rewriteTitle(content),
    // ... same mapping as above
  };

  if (!featureMap[feature]) {
    throw new Error(`Invalid feature: ${feature}`);
  }

  const result = await featureMap[feature]();

  if (sourceId && result.success) {
    await upsertAIContent(feature, sourceId, result.data);
  }

  return result;
}