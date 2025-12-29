import pool from '../config/db.js';

// Activity types enum for consistency
export const ActivityType = {
  QUESTION_ASKED: 'question_asked',
  QUESTION_EDITED: 'question_edited',
  ANSWER_POSTED: 'answer_posted', 
  ANSWER_EDITED: 'answer_edited',
  ANSWER_ACCEPTED: 'answer_accepted',
  VOTE_CAST: 'vote_cast',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked'
};

/**
 * Create a new activity record
 */
export const createActivity = async (activityData) => {
  const { user_id, type, reference_id, message, metadata = null } = activityData;
  
  const result = await pool.query(
    `INSERT INTO activities (user_id, type, reference_id, message, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user_id, type, reference_id, message, metadata]
  );
  return result.rows[0];
};

/**
 * Get activities for a specific user with pagination
 */
export const getUserActivities = async (user_id, options = {}) => {
  const { limit = 20, offset = 0 } = options;
  
  const result = await pool.query(
    `SELECT * FROM activities 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [user_id, limit, offset]
  );
  return result.rows;
};

/**
 * Get activity count for a user (for pagination)
 */
export const getUserActivityCount = async (user_id) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM activities WHERE user_id = $1`,
    [user_id]
  );
  return parseInt(result.rows[0].count);
};

/**
 * Get recent activities for multiple users (for dashboard/feed)
 */
export const getRecentActivities = async (user_ids, limit = 50) => {
  const result = await pool.query(
    `SELECT a.*, u.name as user_name, u.avatar_url
     FROM activities a
     JOIN users u ON a.user_id = u.id
     WHERE a.user_id = ANY($1)
     ORDER BY a.created_at DESC 
     LIMIT $2`,
    [user_ids, limit]
  );
  return result.rows;
};

/**
 * Batch create activities (for bulk operations)
 */
export const createActivities = async (activities) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const createdActivities = [];
    for (const activity of activities) {
      const { user_id, type, reference_id, message, metadata = null } = activity;
      
      const result = await client.query(
        `INSERT INTO activities (user_id, type, reference_id, message, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, type, reference_id, message, metadata]
      );
      createdActivities.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    return createdActivities;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};