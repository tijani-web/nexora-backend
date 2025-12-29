import express from "express";
import {
  getAnswersForQuestion,
  getSingleAnswer,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  getAllAnswer,
  acceptAnswer,
} from "../controllers/answerController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🟢 Admin only: Get all answers
router.get("/", protect, admin, getAllAnswer);

// 🟢 Get all answers for a specific question (any user)
router.get("/question/:questionId", getAnswersForQuestion);

// 🟢 Create new answer for a specific question (protected)
router.post("/question/:questionId", protect, createAnswer);

// 🟢 Accept an answer (protected)
router.patch('/:id/accept', protect, acceptAnswer);

// 🟣 Single answer operations (protected for update/delete)
router
  .route("/:id")
  .get(getSingleAnswer)
  .put(protect, updateAnswer)
  .delete(protect, deleteAnswer);

export default router;
