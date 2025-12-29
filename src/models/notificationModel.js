import pool from '../config/db.js';

// Notification types enum
export const NotificationType = {
  ANSWER_POSTED: 'answer_posted',
  ANSWER_ACCEPTED: 'answer_accepted', 
  VOTE_RECEIVED: 'vote_received',
  MENTION: 'mention',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked'
};

/**
 * Create a new notification
 */
export const createNotification = async (notificationData) => {
  const { user_id, type, title, message, reference_id = null, metadata = null } = notificationData;
  
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, reference_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, type, title, message, reference_id, metadata]
  );
  return result.rows[0];
};

/**
 * Get notifications for a user with pagination
 */
export const getUserNotifications = async (user_id, options = {}) => {
  const { limit = 20, offset = 0 } = options;
  
  const result = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [user_id, limit, offset]
  );
  return result.rows;
};

/**
 * Get unread notifications count for a user
 */
export const getUnreadCount = async (user_id) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications 
     WHERE user_id = $1 AND is_read = false`,
    [user_id]
  );
  return parseInt(result.rows[0].count);
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notification_id, user_id) => {
  const result = await pool.query(
    `UPDATE notifications 
     SET is_read = true 
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notification_id, user_id]
  );
  return result.rows[0];
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (user_id) => {
  const result = await pool.query(
    `UPDATE notifications 
     SET is_read = true 
     WHERE user_id = $1 AND is_read = false
     RETURNING COUNT(*) as updated_count`,
    [user_id]
  );
  return parseInt(result.rows[0].updated_count);
};

/**
 * Get notification by ID (for validation)
 */
export const getNotificationById = async (notification_id) => {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE id = $1`,
    [notification_id]
  );
  return result.rows[0];
};