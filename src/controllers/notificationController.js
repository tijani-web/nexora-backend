import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getNotificationById,
  NotificationType
} from '../models/notificationModel.js';

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const notifications = await getUserNotifications(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const unreadCount = await getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total: notifications.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        unreadCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get unread notifications count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadNotificationsCount = async (req, res, next) => {
  try {
    const count = await getUnreadCount(req.user.id);
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify notification exists and belongs to user
    const notification = await getNotificationById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }

    const updatedNotification = await markAsRead(id, req.user.id);

    res.status(200).json({
      success: true,
      data: updatedNotification
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const updatedCount = await markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      data: { updatedCount },
      message: `Marked ${updatedCount} notifications as read`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a notification (for testing/internal use)
 * @route   POST /api/notifications
 * @access  Private
 */
export const createNotificationController = async (req, res, next) => {
  try {
    const { user_id, type, title, message, reference_id, metadata } = req.body;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'user_id, type, title, and message are required'
      });
    }

    const notification = await createNotification({
      user_id,
      type,
      title,
      message,
      reference_id,
      metadata
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};