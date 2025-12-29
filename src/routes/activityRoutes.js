import express from 'express';
import {
  getMyActivities,
  getUserActivitiesController,  // ✅ CHANGED IMPORT
  getActivityFeed,
  getActivityTypes
} from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validatePagination } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/types', getActivityTypes);
router.get('/user/:userId', validatePagination, getUserActivitiesController);  // ✅ CHANGED

// Protected routes
router.get('/me', protect, validatePagination, getMyActivities);
router.get('/feed', protect, validatePagination, getActivityFeed);

export default router;