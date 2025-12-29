import express from 'express';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotificationController
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validatePagination } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// GET /api/notifications - Get user's notifications
router.get('/', validatePagination, getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', getUnreadNotificationsCount);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', markNotificationAsRead);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', markAllNotificationsAsRead);

// POST /api/notifications - Create notification (for testing/internal use)
router.post('/', createNotificationController);

export default router;