import { 
  getUserActivities as getUserActivitiesFromDB, 
  getUserActivityCount,
  getRecentActivities,
  ActivityType 
} from '../models/activityModel.js';
import { validateUUID } from '../utils/validation.js';

/**
 * @desc    Get current user's activities
 * @route   GET /api/activities/me
 * @access  Private
 */
export const getMyActivities = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const activities = await getUserActivitiesFromDB(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const totalCount = await getUserActivityCount(req.user.id);
    
    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + activities.length) < totalCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get activities for a specific user
 * @route   GET /api/activities/user/:userId
 * @access  Public
 */
export const getUserActivitiesController = async (req, res, next) => {  // ✅ CHANGED NAME
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Validate UUID
    if (!validateUUID(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    const activities = await getUserActivitiesFromDB(userId, {  // ✅ Using renamed import
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const totalCount = await getUserActivityCount(userId);
    
    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + activities.length) < totalCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get recent activities from followed users (for feed)
 * @route   GET /api/activities/feed
 * @access  Private
 */
export const getActivityFeed = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    
    // For now, return user's own activities
    // Later: Get activities from followed users
    const activities = await getUserActivitiesFromDB(req.user.id, {  // ✅ Using renamed import
      limit: parseInt(limit),
      offset: 0
    });
    
    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get activity types enum
 * @route   GET /api/activities/types
 * @access  Public
 */
export const getActivityTypes = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: ActivityType
    });
  } catch (err) {
    next(err);
  }
};