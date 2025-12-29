import {
  addBookmark,
  removeBookmark,
  getUserBookmarks,
  isQuestionBookmarked,
  getBookmarkCount
} from '../models/bookmarkModel.js';

// @desc    Add bookmark
// @route   POST /api/bookmarks
export const createBookmark = async (req, res, next) => {
  try {
    const { question_id } = req.body;
    const user_id = req.user.id;

    if (!question_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Question ID is required' 
      });
    }

    const bookmark = await addBookmark(user_id, question_id);
    
    res.status(201).json({
      success: true,
      data: bookmark,
      message: 'Question bookmarked successfully'
    });
    
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'Question already bookmarked'
      });
    }
    next(error);
  }
};

// @desc    Remove bookmark
// @route   DELETE /api/bookmarks/:questionId
export const deleteBookmark = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const user_id = req.user.id;

    const bookmark = await removeBookmark(user_id, questionId);
    
    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bookmark removed successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's bookmarks
// @route   GET /api/bookmarks/me
export const getMyBookmarks = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const bookmarks = await getUserBookmarks(
      user_id, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.status(200).json({
      success: true,
      data: bookmarks,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: bookmarks.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Check if question is bookmarked
// @route   GET /api/bookmarks/check/:questionId
export const checkBookmark = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const user_id = req.user.id;

    const isBookmarked = await isQuestionBookmarked(user_id, questionId);

    res.status(200).json({
      success: true,
      data: { isBookmarked }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookmark count for question
// @route   GET /api/bookmarks/count/:questionId
export const getQuestionBookmarkCount = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const count = await getBookmarkCount(questionId);

    res.status(200).json({
      success: true,
      data: { count }
    });
    
  } catch (error) {
    next(error);
  }
};