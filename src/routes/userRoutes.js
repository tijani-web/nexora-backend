import express from 'express';
import {
  getMe,
  getUser,
  getUsers,
  updateUser,
  deleteUser,
  getUserQuestions,
  getUserAnswers,
  getUserStats,
  getPublicUsers,
  getUserSettings,
  updateUserSettings,
  getUserByIdOrSlug 
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Current logged-in user
router.get('/me', protect, getMe);

// Settings routes
router.get('/settings', protect, getUserSettings);
router.put('/settings', protect, updateUserSettings);

// Single user by ID or slug 
router.get('/:identifier', protect, getUserByIdOrSlug);

// Single user by ID only 
router.get('/id/:id', protect, getUser);

// Get user questions 
router.get('/:identifier/questions', getUserQuestions);

// Get user answers  
router.get('/:identifier/answers', getUserAnswers);

// Get user stats 
router.get('/:identifier/stats', getUserStats);

// Get public users for mentions
router.get('/public/list', getPublicUsers);

// Update user profile 
router.put('/:id', protect, updateUser);

// Delete user profile 
router.delete('/:id', protect, deleteUser);

// Admin-only route to list all users
router.get('/', protect, admin, getUsers);

export default router;