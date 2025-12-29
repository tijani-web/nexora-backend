import {
  getAllQuestionsFromDB,
  getQuestionById,
  createQuestionInDB,
  updateQuestionInDB,
  deleteQuestionInDB,
  getPaginatedQuestionsFromDB,
  getTrendingQuestionsFromDB
} from '../models/questionModel.js';
import { ActivityService } from '../services/activityServices.js';
import { NotificationService } from '../services/notificationService.js';
import { processMentions } from '../utils/mentionParser.js';
import { findById } from '../models/userModel.js';
import { slugify } from '../utils/slugify.js';

// @desc Get all questions
export const getAllQuestions = async (req, res, next) => {
  try {
    const questions = await getAllQuestionsFromDB();
    res.status(200).json(questions);
  } catch (err) {
    next(err);
  }
};

// @desc Get paginated questions
export const getPaginatedQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const questions = await getPaginatedQuestionsFromDB(page, limit);
    res.status(200).json({
      questions,
      pagination: {
        page,
        limit,
        hasMore: questions.length === limit 
      }
    });
  } catch (err) {
    next(err);
  }
};


// @desc Get trending questions
// @route GET /api/questions/trending
// @access Public
export const getTrendingQuestions = async (req, res, next) => {
  try {
    const { timeframe = 'week' } = req.query;
    
    const validTimeframes = ['today', 'week', 'month'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid timeframe. Use: today, week, or month' 
      });
    }

    const questions = await getTrendingQuestionsFromDB(timeframe);
    
    res.status(200).json({
      success: true,
      data: questions,
      timeframe,
      total: questions.length
    });
  } catch (err) {
    next(err);
  }
};


// @desc Get question by slug or ID
// @route GET /api/questions/:identifier
export const getQuestionByIdOrSlug = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    
    let question;
    
    // Check if identifier is a UUID (ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    if (isUUID) {
      // Direct ID access
      question = await getQuestionById(identifier);
    } else {
      // Slug-based access - find by matching title slug
      const allQuestions = await getAllQuestionsFromDB();
      question = allQuestions.find(q => 
        slugify(q.title) === identifier
      );
    }
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.status(200).json(question);
  } catch (err) {
    next(err);
  }
};

// @desc Get a single question (now handles both ID and slug)
export const getSingleQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await getQuestionById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(200).json(question);
  } catch (err) {
    next(err);
  }
};

// @route POST /api/questions
// @desc Create new question
export const createQuestion = async (req, res, next) => {
  try {
    const { title, body, image_url, tags } = req.body; 
    const user_id = req.user.id;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    } 

    const newQuestion = await createQuestionInDB(
      user_id,
      title.trim(),
      body?.trim() || null,
      image_url || null,
      tags || []
    );
    
    // Record activity
    await ActivityService.recordQuestionAsked(user_id, newQuestion);
    
    // PROCESS MENTIONS in question title and body - FIXED
    const mentioner = await findById(user_id); 
    const fullText = `${title} ${body || ''}`;
    await processMentions(fullText, mentioner, newQuestion.id, 'question');
    
    res.status(201).json(newQuestion);
  } catch (err) {
    next(err);
  }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, body, image_url } = req.body;

    if (!title && !body && !image_url) {
      return res.status(400).json({ message: 'At least one field is required' });
    }

    const updated = await updateQuestionInDB(id, title, body, image_url);

    if (!updated) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Record question edit activity
    await ActivityService.recordQuestionEdited(req.user.id, updated);
    
    // PROCESS MENTIONS in updated content - FIXED
    const mentioner = await findById(req.user.id); // ✅ CHANGED TO findById
    const fullText = `${title || ''} ${body || ''}`;
    if (fullText.trim()) {
      await processMentions(fullText, mentioner, id, 'question');
    }

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// @desc Delete question
// @route DELETE /api/questions/:id
export const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await deleteQuestionInDB(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Question not found or already deleted' });
    }

    res.status(200).json({ message: `Question with id ${id} deleted successfully` });
  } catch (err) {
    next(err);
  }
};

