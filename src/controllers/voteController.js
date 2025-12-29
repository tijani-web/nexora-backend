import { getAnswerById } from '../models/answerModel.js';
import { getQuestionById } from '../models/questionModel.js';
import { findById } from '../models/userModel.js'; 
import { upsertVote, removeVote, getVoteCounts, getUserVote } from '../models/voteModel.js';
import { ActivityService } from '../services/activityServices.js';
import { NotificationService } from '../services/notificationService.js';

// POST /api/votes → cast or change vote
export const castVote = async (req, res, next) => {
  try {
    const { answer_id, vote_type } = req.body;
    const user_id = req.user.id;

    if (!answer_id || !['upvote','downvote'].includes(vote_type)) {
      return res.status(400).json({ message: 'Invalid vote data' });
    }

    const vote = await upsertVote({ user_id, answer_id, vote_type });
    const counts = await getVoteCounts(answer_id);

    const answer = await getAnswerById(answer_id);
    if (answer) {
      const question = await getQuestionById(answer.question_id);
      if (question) {
        await ActivityService.recordVoteCast(user_id, vote_type, answer, question);
        
        // ✅ NOTIFY ANSWER AUTHOR (if not voting on own answer) - FIXED
        if (answer.user_id !== user_id) {
          const voter = await findById(user_id); // ✅ CHANGED TO findById
          await NotificationService.notifyVoteReceived(
            answer.user_id,
            vote_type,
            answer,
            question,
            voter
          );
        }
      }
    }
    
    res.status(200).json({
      message: 'Vote recorded successfully',
      vote,
      counts
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/votes/:answer_id → remove vote
export const deleteVote = async (req, res, next) => {
  try {
    const answer_id = req.params.answer_id;
    const user_id = req.user.id;

    const deleted = await removeVote(user_id, answer_id);
    const counts = await getVoteCounts(answer_id);

    if (!deleted) {
      return res.status(404).json({ message: 'No vote found to delete' });
    }

    res.status(200).json({
      message: 'Vote removed successfully',
      counts
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/votes/:answer_id → get counts + user vote
export const getVotes = async (req, res, next) => {
  try {
    const answer_id = req.params.answer_id;
    const user_id = req.user?.id || null;

    const counts = await getVoteCounts(answer_id);
    let userVote = null;

    if (user_id) {
      userVote = await getUserVote(user_id, answer_id);
    }

    res.status(200).json({
      counts,
      userVote
    });
  } catch (err) {
    next(err);
  }
};
