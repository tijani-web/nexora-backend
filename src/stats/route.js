// api/src/routes/statsRoutes.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// @desc    Get platform statistics
// @route   GET /api/stats
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Get all counts in parallel
    const [
      questionsResult,
      answersResult, 
      usersResult,
      tagsResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM questions'),
      pool.query('SELECT COUNT(*) FROM answers'),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(DISTINCT name) FROM tags')
    ]);

    const stats = {
      questions: parseInt(questionsResult.rows[0].count),
      answers: parseInt(answersResult.rows[0].count),
      users: parseInt(usersResult.rows[0].count),
      tags: parseInt(tagsResult.rows[0].count)
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch platform statistics',
      error: error.message 
    });
  }
});

export default router;