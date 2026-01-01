// userRoutes.js - FIXED VERSION
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
  getUserByIdOrSlug,
  checkUserData
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Current logged-in user
router.get('/me', protect, getMe);

// Settings routes
router.get('/settings', protect, getUserSettings);
router.put('/settings', protect, updateUserSettings);

// ✅ FIXED: Specific routes FIRST
router.get('/:userId/check-data', checkUserData);
router.get('/:userId/questions', getUserQuestions);      
router.get('/:userId/answers', getUserAnswers);          
router.get('/:userId/stats', getUserStats);              

// Single user by ID or slug 
router.get('/:identifier', protect, getUserByIdOrSlug);  

// Single user by ID only 
router.get('/id/:id', protect, getUser);

// Get public users for mentions
router.get('/public/list', getPublicUsers);

// Update user profile 
router.put('/:id', protect, updateUser);

// Delete user profile 
router.delete('/:id', protect, deleteUser);

// Admin-only route to list all users
router.get('/', protect, admin, getUsers);

export default router;