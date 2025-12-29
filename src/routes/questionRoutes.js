import express from 'express';
import { 
  createQuestion, 
  deleteQuestion,
  getAllQuestions, 
  getPaginatedQuestions, 
  getSingleQuestion, 
  getTrendingQuestions, 
  updateQuestion,
  getQuestionByIdOrSlug 
} from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';
import pool from '../config/db.js';
import { slugify } from '../utils/slugify.js'; 

const router = express.Router();

// @desc Get all questions
router.get('/', getAllQuestions);

// Add paginated route
router.get('/paginated', getPaginatedQuestions);

// @desc Get trending questions
router.get('/trending', getTrendingQuestions);

// @desc Get a single question by ID or slug (UPDATED)
router.get('/:identifier', getQuestionByIdOrSlug);

// @desc Get question by ID only (backward compatibility)
router.get('/id/:id', getSingleQuestion);

// @desc Create a new question (Protected)
router.post('/', protect, createQuestion);

// @desc Update a question (Protected) - still uses ID
router.put('/:id', protect, updateQuestion);

// @desc Delete a question (Protected) - still uses ID
router.delete('/:id', protect, deleteQuestion);

// @desc Increment views count for a question - works with both ID and slug
router.post('/:identifier/views', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log('📊 Incrementing views for question:', identifier);
    
    let questionId;
    
    // Check if identifier is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    if (isUUID) {
      questionId = identifier;
    } else {
      // For slug, we need to find the question first
      const allQuestions = await pool.query('SELECT id, title FROM questions');
      const question = allQuestions.rows.find(q => 
        slugify(q.title) === identifier
      );
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      questionId = question.id;
    }
    
    await pool.query(
      'UPDATE questions SET views_count = views_count + 1 WHERE id = $1',
      [questionId]
    );
    
    console.log('✅ View counted for question:', identifier);
    res.status(200).json({ message: 'View counted' });
  } catch (error) {
    console.error('❌ View count error:', error);
    res.status(500).json({ message: 'Failed to count view' });
  }
});

// Question voting routes - updated to handle both ID and slug
router.post('/:identifier/votes', protect, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { vote_type } = req.body;
    const user_id = req.user.id;

    if (!['upvote', 'downvote'].includes(vote_type)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    let questionId;
    
    // Check if identifier is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    if (isUUID) {
      questionId = identifier;
    } else {
      // For slug, find the question first
      const allQuestions = await pool.query('SELECT id, title FROM questions');
      const question = allQuestions.rows.find(q => 
        slugify(q.title) === identifier
      );
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      questionId = question.id;
    }

    // Upsert vote (insert or update)
    const result = await pool.query(`
      INSERT INTO votes (user_id, question_id, vote_type, answer_id)
      VALUES ($1, $2, $3, NULL)
      ON CONFLICT (user_id, question_id) 
      DO UPDATE SET vote_type = EXCLUDED.vote_type, created_at = NOW()
      RETURNING *
    `, [user_id, questionId, vote_type]);

    res.status(200).json({
      message: 'Vote recorded successfully',
      vote: result.rows[0]
    });
  } catch (error) {
    console.error('Question vote error:', error);
    res.status(500).json({ message: 'Failed to record vote' });
  }
});

router.delete('/:identifier/votes', protect, async (req, res) => {
  try {
    const { identifier } = req.params;
    const user_id = req.user.id;

    let questionId;
    
    // Check if identifier is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    if (isUUID) {
      questionId = identifier;
    } else {
      // For slug, find the question first
      const allQuestions = await pool.query('SELECT id, title FROM questions');
      const question = allQuestions.rows.find(q => 
        slugify(q.title) === identifier
      );
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      questionId = question.id;
    }

    const result = await pool.query(
      'DELETE FROM votes WHERE user_id = $1 AND question_id = $2 AND answer_id IS NULL RETURNING *',
      [user_id, questionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No vote found to delete' });
    }

    res.status(200).json({ message: 'Vote removed successfully' });
  } catch (error) {
    console.error('Question vote delete error:', error);
    res.status(500).json({ message: 'Failed to remove vote' });
  }
});

router.get('/:identifier/votes', async (req, res) => {
  try {
    const { identifier } = req.params;

    let questionId;
    
    // Check if identifier is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    if (isUUID) {
      questionId = identifier;
    } else {
      // For slug, find the question first
      const allQuestions = await pool.query('SELECT id, title FROM questions');
      const question = allQuestions.rows.find(q => 
        slugify(q.title) === identifier
      );
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      questionId = question.id;
    }

    const countsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE vote_type = 'upvote') AS upvotes,
        COUNT(*) FILTER (WHERE vote_type = 'downvote') AS downvotes
      FROM votes 
      WHERE question_id = $1 AND answer_id IS NULL
    `, [questionId]);

    const userVoteResult = await pool.query(
      'SELECT vote_type FROM votes WHERE question_id = $1 AND user_id = $2 AND answer_id IS NULL',
      [questionId, req.user?.id]
    );

    res.status(200).json({
      counts: countsResult.rows[0],
      userVote: userVoteResult.rows[0]?.vote_type || null
    });
  } catch (error) {
    console.error('Get question votes error:', error);
    res.status(500).json({ message: 'Failed to get votes' });
  }
});

export default router;