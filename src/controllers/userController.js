import { 
  findById, 
  updateById, 
  deleteById, 
  getAllUsers,
  getUserSettings as getUserSettingsModel,
  updateUserSettings as updateUserSettingsModel
} from '../models/userModel.js';
import pool from '../config/db.js'; 
import { slugify } from '../utils/slugify.js';


// @desc Get user settings 
export const getUserSettings = async (req, res) => {
  try {
    const settings = await getUserSettingsModel(req.user.id);
    res.status(200).json(settings);
  } catch (err) {
    console.error('Error in getUserSettings:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user settings' 
    });
  }
};

// @desc Update user settings 
// SIMPLIFIED - Update user settings
export const updateUserSettings = async (userId, settings) => {
  try {
    console.log('🎯 SIMPLIFIED: Saving theme & language only');
    
    // Only save what we need for portfolio
    const simplifiedSettings = {
      preferences: {
        theme: settings.preferences?.theme || 'system',
        language: settings.preferences?.language || 'en',
        // Keep defaults for the rest
        timezone: 'UTC',
        date_format: 'MMM dd, yyyy'
      }
    };
    
    const result = await pool.query(
      `UPDATE users 
       SET settings = $1
       WHERE id = $2
       RETURNING id, settings`,
      [simplifiedSettings, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    console.log('✅ SIMPLIFIED: Settings saved successfully');
    return result.rows[0].settings;
  } catch (error) {
    console.error('❌ SIMPLIFIED: Error:', error.message);
    throw error;
  }
};


// @desc Get logged-in user's profile
// @route GET /api/users/me
export const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc Get user by username slug or ID
// @route GET /api/users/:identifier
export const getUserByIdOrSlug = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let user;
    
    // Check if identifier is a UUID (ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    if (isUUID) {
      // Direct ID access
      user = await findById(identifier);
    } else {
      // Slug-based access - find by matching username slug
      const allUsers = await getAllUsers();
      user = allUsers.find(u => 
        slugify(u.name) === identifier
      );
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get single user by ID (keep for backward compatibility)
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get public users for mentions (no admin protection)
export const getPublicUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, avatar_url 
       FROM users 
       ORDER BY name ASC
       LIMIT 100` // Limit for safety
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 🆕 Get user's questions
export const getUserQuestions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const questions = await pool.query(`
      SELECT 
        q.*,
        u.name AS author_name,
        u.avatar_url AS avatar_url,
        COUNT(DISTINCT a.id) AS answers_count,
        COALESCE(SUM(CASE 
          WHEN v.vote_type = 'upvote' THEN 1 
          WHEN v.vote_type = 'downvote' THEN -1 
          ELSE 0 END), 0) AS votes_count,
        ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN answers a ON a.question_id = q.id
      LEFT JOIN votes v ON v.answer_id = a.id
      LEFT JOIN question_tags qt ON qt.question_id = q.id
      LEFT JOIN tags t ON t.id = qt.tag_id
      WHERE q.user_id = $1
      GROUP BY q.id, u.name, u.avatar_url
      ORDER BY q.created_at DESC
    `, [userId]);
    
    res.status(200).json(questions.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 🆕 Get user's answers with question info
export const getUserAnswers = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const answers = await pool.query(`
      SELECT 
        a.*,
        u.name AS author_name,
        u.avatar_url AS avatar_url,
        q.title AS question_title,
        COALESCE(SUM(CASE 
          WHEN v.vote_type = 'upvote' THEN 1 
          WHEN v.vote_type = 'downvote' THEN -1 
          ELSE 0 END), 0) AS votes_count
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN questions q ON a.question_id = q.id
      LEFT JOIN votes v ON v.answer_id = a.id
      WHERE a.user_id = $1
      GROUP BY a.id, u.name, u.avatar_url, q.title
      ORDER BY a.created_at DESC
    `, [userId]);
    
    res.status(200).json(answers.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 🆕 Get user stats
export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get questions count and total views
    const questionsResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(views_count), 0) as total_views 
       FROM questions WHERE user_id = $1`,
      [userId]
    );
    
    // ✅ FIXED: Use votes table instead of votes_count column
    const answersResult = await pool.query(
      `SELECT 
         COUNT(*) as count,
         COUNT(*) FILTER (WHERE is_accepted = true) as accepted_count
       FROM answers 
       WHERE user_id = $1`,
      [userId]
    );

    // ✅ FIXED: Calculate total votes from votes table
    const votesResult = await pool.query(
      `SELECT 
         COALESCE(SUM(
           CASE 
             WHEN v.vote_type = 'upvote' THEN 1 
             WHEN v.vote_type = 'downvote' THEN -1 
             ELSE 0 
           END
         ), 0) as total_votes
       FROM votes v
       JOIN answers a ON v.answer_id = a.id
       WHERE a.user_id = $1`,
      [userId]
    );

    const stats = {
      questionsCount: parseInt(questionsResult.rows[0].count),
      answersCount: parseInt(answersResult.rows[0].count),
      totalViews: parseInt(questionsResult.rows[0].total_views),
      totalVotes: parseInt(votesResult.rows[0].total_votes),
      acceptedAnswers: parseInt(answersResult.rows[0].accepted_count)
    };

    console.log('📊 User stats:', stats); // Debug log

    res.status(200).json(stats);
  } catch (err) {
    console.error('❌ Error in getUserStats:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Update user (only self)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow updating own profile
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'Forbidden: cannot update another user' });
    }

    const updated = await updateById(id, req.body);
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Delete user (only self)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow deleting own profile
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'Forbidden: cannot delete another user' });
    }

    const deleted = await deleteById(id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: `User deleted: ${deleted.id}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get all users (admin)
export const getUsers = async (req, res) => {
  try {
    // optional: add role check here if needed
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};