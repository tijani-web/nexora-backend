import {
  getAllAnswers,
  getAllAnswersForQuestion,
  getAnswerById,
  createAnswerInDB,
  updateAnswerInDB,
  deleteAnswerInDB,
} from "../models/answerModel.js";
import { getQuestionById } from "../models/questionModel.js"; 
import pool from "../config/db.js";
import { ActivityService } from "../services/activityServices.js";
import { NotificationService } from '../services/notificationService.js';
import { processMentions } from '../utils/mentionParser.js';
import { findById } from "../models/userModel.js";

// Get all answers (admin)
export const getAllAnswer = async (req, res) => {
  try {
    const answers = await getAllAnswers();
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all answers for a specific question
export const getAnswersForQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const answers = await getAllAnswersForQuestion(questionId);
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get single answer
export const getSingleAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const answer = await getAnswerById(id);
    if (!answer) return res.status(404).json({ message: "Answer not found" });
    res.status(200).json(answer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Create new answer under question
export const createAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { body, image_url } = req.body;
    const userId = req.user?.id;

    console.log('🔍 CREATE ANSWER DEBUG:');
    console.log('🔍 Question ID:', questionId);
    console.log('🔍 User ID:', userId);

    if (!body) return res.status(400).json({ message: "Answer body is required" });

    // Create answer
    const newAnswer = await createAnswerInDB(questionId, userId, body, image_url);
    console.log('🔍 Answer created:', newAnswer.id);
    
    // Get the question first before recording activity
    const question = await getQuestionById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    console.log('🔍 Question found - Owner:', question.author_id);
    console.log('🔍 Answer Author:', userId);
    console.log('🔍 Same user?', question.author_id === userId);
    
    // Now record the activity
    await ActivityService.recordAnswerPosted(userId, newAnswer, question);
    
    // ✅ NOTIFY QUESTION OWNER (if not answering own question)
    if (question.author_id !== userId) {
      console.log('🔔 SHOULD NOTIFY QUESTION OWNER');
      
      const answerAuthor = await findById(userId);
      console.log('🔔 Answer author found:', answerAuthor);
      
      if (answerAuthor) {
        console.log('🔔 Sending notification to question owner:', question.author_id);
        await NotificationService.notifyAnswerPosted(
          question.author_id, 
          newAnswer, 
          question, 
          answerAuthor
        );
        console.log('🔔 Notification sent!');
      } else {
        console.log('❌ Answer author not found');
      }
    } else {
      console.log('🔕 Skipping notification - answering own question');
    }
    
    // Update question's answers_count (+1)
    await pool.query(
      `UPDATE questions SET answers_count = answers_count + 1 WHERE id = $1`,
      [questionId]
    );

    res.status(201).json(newAnswer);
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Add this function to your answerController.js
export const acceptAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the answer first
    const answer = await getAnswerById(id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Get the question to check ownership
    const question = await getQuestionById(answer.question_id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // ✅ FIXED: Check if user owns the question (use author_id)
    if (question.author_id !== userId) {
      return res.status(403).json({ message: "Only question owner can accept answers" });
    }

    // First, unaccept any currently accepted answer for this question
    await pool.query(
      `UPDATE answers SET is_accepted = false WHERE question_id = $1 AND is_accepted = true`,
      [answer.question_id]
    );

    // Then accept this answer
    const result = await pool.query(
      `UPDATE answers SET is_accepted = true WHERE id = $1 RETURNING *`,
      [id]
    );

    const updatedAnswer = result.rows[0];

    // Record activity if the answer author is different from question owner
    if (updatedAnswer.user_id !== userId) {
      await ActivityService.recordAnswerAccepted(updatedAnswer.user_id, updatedAnswer, question);
      
      // ✅ NOTIFY ANSWER AUTHOR
      const questionOwner = await findById(userId);
      if (questionOwner) {
        await NotificationService.notifyAnswerAccepted(
          updatedAnswer.user_id,
          updatedAnswer,
          question,
          questionOwner
        );
      }
    }

    res.status(200).json(updatedAnswer);
  } catch (error) {
    console.error("Error accepting answer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update answer
export const updateAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const updatedAnswer = await updateAnswerInDB(id, body);

    if (!updatedAnswer)
      return res.status(404).json({ message: "Answer not found" });

    // ✅ PROCESS MENTIONS in updated answer body - FIXED
    const mentioner = await findById(req.user.id); // ✅ CHANGED TO findById
    await processMentions(body, mentioner, id, 'answer');

    const question = await getQuestionById(updatedAnswer.question_id);
    if (question) {
      await ActivityService.recordAnswerEdited(req.user.id, updatedAnswer, question);
    }
    
    res.status(200).json(updatedAnswer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete answer
export const deleteAnswer = async (req, res) => {
  try {
    const { id } = req.params;

    // Find answer to know which question it belongs to
    const answer = await getAnswerById(id);
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    // Delete the answer
    const result = await deleteAnswerInDB(id);

    // Decrease question's answers_count (-1)
    await pool.query(
      `UPDATE questions SET answers_count = GREATEST(answers_count - 1, 0) WHERE id = $1`,
      [answer.question_id]
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting answer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};