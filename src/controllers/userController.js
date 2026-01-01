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

//  Get user's questions
export const getUserQuestions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // console.log('🔍 getUserQuestions for user:', userId);
    
    const questions = await pool.query(`
      SELECT 
        q.*,
        u.name AS author_name,
        u.avatar_url AS avatar_url,
        COALESCE(answer_counts.answers_count, 0) AS answers_count,
        COALESCE(vote_counts.votes_count, 0) AS votes_count,
        COALESCE(question_tags.tags, ARRAY[]::varchar[]) AS tags
      FROM questions q
      LEFT JOIN users u ON q.author_id = u.id
      
      -- Get answers count separately
      LEFT JOIN (
        SELECT question_id, COUNT(*) as answers_count
        FROM answers
        GROUP BY question_id
      ) answer_counts ON answer_counts.question_id = q.id
      
      -- Get votes count separately  
      LEFT JOIN (
        SELECT a.question_id, 
               SUM(CASE 
                 WHEN v.vote_type = 'upvote' THEN 1 
                 WHEN v.vote_type = 'downvote' THEN -1 
                 ELSE 0 
               END) as votes_count
        FROM answers a
        LEFT JOIN votes v ON v.answer_id = a.id
        GROUP BY a.question_id
      ) vote_counts ON vote_counts.question_id = q.id
      
      -- Get tags separately
      LEFT JOIN (
        SELECT qt.question_id, 
               ARRAY_AGG(DISTINCT t.name) as tags
        FROM question_tags qt
        LEFT JOIN tags t ON t.id = qt.tag_id
        GROUP BY qt.question_id
      ) question_tags ON question_tags.question_id = q.id
      
      WHERE q.author_id = $1
      ORDER BY q.created_at DESC
    `, [userId]);
    
    console.log('✅ Found questions:', questions.rows.length);
    
    res.status(200).json(questions.rows);
  } catch (err) {
    console.error('❌ Error in getUserQuestions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's answers with question info
export const getUserAnswers = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // console.log('🔍 getUserAnswers for user:', userId);
    
    const answers = await pool.query(`
      SELECT 
        a.*,
        u.name AS author_name,
        u.avatar_url AS avatar_url,
        q.title AS question_title,
        COALESCE(vote_counts.votes_count, 0) AS votes_count
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN questions q ON a.question_id = q.id
      LEFT JOIN (
        SELECT answer_id,
               SUM(CASE 
                 WHEN vote_type = 'upvote' THEN 1 
                 WHEN vote_type = 'downvote' THEN -1 
                 ELSE 0 
               END) as votes_count
        FROM votes
        GROUP BY answer_id
      ) vote_counts ON vote_counts.answer_id = a.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `, [userId]);
    
    // console.log('✅ Found answers:', answers.rows.length);
    
    res.status(200).json(answers.rows);
  } catch (err) {
    console.error('❌ Error in getUserAnswers:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//  Get user stats
export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get questions count and total views
    const questionsResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(views_count), 0) as total_views 
       FROM questions WHERE author_id = $1`,
      [userId]
    );
    
    // Use votes table instead of votes_count column
    const answersResult = await pool.query(
      `SELECT 
         COUNT(*) as count,
         COUNT(*) FILTER (WHERE is_accepted = true) as accepted_count
       FROM answers 
       WHERE user_id = $1`,
      [userId]
    );

    //  Calculate total votes from votes table
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

    // console.log('📊 User stats:', stats); // Debug log

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


// Add to userController.js
export const checkUserData = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // console.log('🔍 Checking user data for:', userId);
    
    // 1. Check if user exists
    const userResult = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.json({
        userExists: false,
        message: 'User not found in database'
      });
    }
    
    const user = userResult.rows[0];
    
    // 2. Check user's questions
    const questionsResult = await pool.query(
      'SELECT id, title, author_id, created_at FROM questions WHERE author_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    // 3. Check user's answers
    const answersResult = await pool.query(
      'SELECT id, question_id, body, user_id, is_accepted, created_at FROM answers WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    // 4. Also check with user_id column (just in case)
    const questionsWithUserIdResult = await pool.query(
      'SELECT id, title, user_id, created_at FROM questions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({
      userExists: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        joined: user.created_at
      },
      questions: {
        usingAuthorId: {
          count: questionsResult.rows.length,
          data: questionsResult.rows.map(q => ({
            id: q.id,
            title: q.title,
            author_id: q.author_id,
            created: q.created_at
          }))
        },
        usingUserId: {
          count: questionsWithUserIdResult.rows.length,
          data: questionsWithUserIdResult.rows.map(q => ({
            id: q.id,
            title: q.title,
            user_id: q.user_id,
            created: q.created_at
          }))
        }
      },
      answers: {
        count: answersResult.rows.length,
        data: answersResult.rows.map(a => ({
          id: a.id,
          question_id: a.question_id,
          body_preview: a.body ? a.body.substring(0, 50) + '...' : null,
          user_id: a.user_id,
          is_accepted: a.is_accepted,
          created: a.created_at
        }))
      },
      summary: {
        userFound: true,
        hasQuestions: questionsResult.rows.length > 0,
        hasAnswers: answersResult.rows.length > 0,
        totalContent: questionsResult.rows.length + answersResult.rows.length
      }
    });
    
  } catch (err) {
    console.error('Check user data error:', err);
    res.status(500).json({ 
      error: err.message,
      queryError: true
    });
  }
};