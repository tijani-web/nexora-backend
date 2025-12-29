// In activityController.js - update getActivityFeed function
export const getActivityFeed = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    
    // For now, return user's own activities
    // Later: Get activities from followed users
    const activities = await getUserActivitiesFromDB(req.user.id, {  // ✅ Fixed
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