import express from 'express';
import {
  createBookmark,
  deleteBookmark,
  getMyBookmarks,
  checkBookmark,
  getQuestionBookmarkCount
} from '../controllers/bookmarkController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', createBookmark);
router.delete('/:questionId', deleteBookmark);
router.get('/me', getMyBookmarks);
router.get('/check/:questionId', checkBookmark);
router.get('/count/:questionId', getQuestionBookmarkCount);

export default router;