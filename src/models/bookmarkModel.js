import pool from '../config/db.js';

// Add bookmark
export const addBookmark = async (user_id, question_id) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert bookmark
    const bookmarkResult = await client.query(
      `INSERT INTO bookmarks (user_id, question_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [user_id, question_id]
    );

    // Increment bookmarks_count on question
    await client.query(
      `UPDATE questions 
       SET bookmarks_count = bookmarks_count + 1 
       WHERE id = $1`,
      [question_id]
    );

    await client.query('COMMIT');
    return bookmarkResult.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Remove bookmark
export const removeBookmark = async (user_id, question_id) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Delete bookmark
    const result = await client.query(
      `DELETE FROM bookmarks 
       WHERE user_id = $1 AND question_id = $2 
       RETURNING *`,
      [user_id, question_id]
    );

    // Decrement bookmarks_count on question
    await client.query(
      `UPDATE questions 
       SET bookmarks_count = GREATEST(bookmarks_count - 1, 0) 
       WHERE id = $1`,
      [question_id]
    );

    await client.query('COMMIT');
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get user's bookmarks with question details
export const getUserBookmarks = async (user_id, limit = 20, offset = 0) => {
  const result = await pool.query(
    `SELECT 
       b.*,
       q.title,
       q.body,
       q.views_count,
       q.answers_count,
       q.bookmarks_count,
       q.created_at as question_created_at,
       u.name as author_name,
       u.avatar_url as author_avatar,
       ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
     FROM bookmarks b
     JOIN questions q ON b.question_id = q.id
     JOIN users u ON q.author_id = u.id
     LEFT JOIN question_tags qt ON q.id = qt.question_id
     LEFT JOIN tags t ON qt.tag_id = t.id
     WHERE b.user_id = $1
     GROUP BY b.id, q.id, u.name, u.avatar_url
     ORDER BY b.created_at DESC
     LIMIT $2 OFFSET $3`,
    [user_id, limit, offset]
  );
  return result.rows;
};

// Check if question is bookmarked by user
export const isQuestionBookmarked = async (user_id, question_id) => {
  const result = await pool.query(
    `SELECT 1 FROM bookmarks 
     WHERE user_id = $1 AND question_id = $2`,
    [user_id, question_id]
  );
  return result.rows.length > 0;
};

// Get bookmark count for a question
export const getBookmarkCount = async (question_id) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM bookmarks 
     WHERE question_id = $1`,
    [question_id]
  );
  return parseInt(result.rows[0].count);
};