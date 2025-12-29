import pool from '../config/db.js';

// Get user settings
export const getUserSettings = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT settings FROM users WHERE id = $1`,
      [userId]
    );
    
    if (!result.rows[0] || !result.rows[0].settings) {
      // Return default settings if none exist
      return {
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          date_format: 'MMM dd, yyyy'
        },
        notifications: {
          email_notifications: true,
          new_answers: true,
          mentions: true,
          weekly_digest: false
        },
        privacy: {
          show_email: false,
          show_activity: true,
          profile_visibility: 'public'
        },
        email_preferences: {
          marketing_emails: false,
          product_updates: true,
          community_digest: true
        }
      };
    }
    
    return result.rows[0].settings;
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    throw error;
  }
};

// Update user settings - FIXED VERSION
export const updateUserSettings = async (userId, settings) => {
  try {
    console.log('🔄 Updating settings for user:', userId);
    console.log('📝 Settings data:', settings);
    
    const result = await pool.query(
      `UPDATE users 
       SET settings = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING settings`,
      [settings, userId]
    );
    
    console.log('✅ Update result:', result.rows[0]);
    
    if (!result.rows[0]) {
      throw new Error('User not found');
    }
    
    return result.rows[0].settings;
  } catch (error) {
    console.error('❌ Error in updateUserSettings:', error);
    throw error;
  }
};

// Find user by email
export const findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, name, email, password_hash, role, created_at 
     FROM users 
     WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

// Find user by ID
export const findById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, avatar_url, role, created_at 
     FROM users 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Find user by username (for mentions)
export const getUserByName = async (name) => {
  const result = await pool.query(
    `SELECT id, name, email, avatar_url FROM users WHERE name = $1`,
    [name]
  );
  return result.rows[0];
};

// Create new user
export const createUser = async ({ name, email, password_hash, role = 'user' }) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, name, email, role, created_at`,
    [name, email, password_hash, role]
  );
  return result.rows[0];
};

// Get all users
export const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT id, name, email, role, created_at 
     FROM users 
     ORDER BY created_at DESC`
  );
  return result.rows;
};

// Update user
export const updateById = async (id, { name, email }) => {
  const result = await pool.query(
    `UPDATE users 
     SET name = COALESCE($1, name),
         email = COALESCE($2, email)
     WHERE id = $3
     RETURNING id, name, email, role, created_at`,
    [name, email, id]
  );
  return result.rows[0] || null;
};

// Delete user
export const deleteById = async (id) => {
  const result = await pool.query(
    `DELETE FROM users 
     WHERE id = $1 
     RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
};