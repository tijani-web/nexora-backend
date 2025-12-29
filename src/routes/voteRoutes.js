import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { castVote, deleteVote, getVotes } from '../controllers/voteController.js';

const router = express.Router();

// Cast or change a vote
router.post('/', protect, castVote);

// Remove a vote
router.delete('/:answer_id', protect, deleteVote);

// Get vote counts and user vote
router.get('/:answer_id', protect, getVotes);

export default router;
