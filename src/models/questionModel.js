import pool from '../config/db.js';

// ✅ Get all questions WITH TAGS 
export const getAllQuestionsFromDB = async () => {
  const result = await pool.query(`
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
    LEFT JOIN users u ON q.author_id = u.id  
    LEFT JOIN answers a ON a.question_id = q.id
    LEFT JOIN votes v ON v.answer_id = a.id
    LEFT JOIN question_tags qt ON qt.question_id = q.id
    LEFT JOIN tags t ON t.id = qt.tag_id
    GROUP BY q.id, u.name, u.avatar_url
    ORDER BY q.created_at DESC
  `);
  return result.rows;
};

//  Get paginated questions WITH TAGS 
export const getPaginatedQuestionsFromDB = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const result = await pool.query(`
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
    LEFT JOIN users u ON q.author_id = u.id 
    LEFT JOIN answers a ON a.question_id = q.id
    LEFT JOIN votes v ON v.answer_id = a.id
    LEFT JOIN question_tags qt ON qt.question_id = q.id
    LEFT JOIN tags t ON t.id = qt.tag_id
    GROUP BY q.id, u.name, u.avatar_url
    ORDER BY q.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  return result.rows;
};

// Get single question WITH TAGS 
export const getQuestionById = async (id) => {
  const result = await pool.query(`
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
    LEFT JOIN users u ON q.author_id = u.id 
    LEFT JOIN answers a ON a.question_id = q.id
    LEFT JOIN votes v ON v.answer_id = a.id
    LEFT JOIN question_tags qt ON qt.question_id = q.id
    LEFT JOIN tags t ON t.id = qt.tag_id
    WHERE q.id = $1
    GROUP BY q.id, u.name, u.avatar_url
  `, [id]);
  return result.rows[0];
};

//  Create new question WITH TAGS 
export const createQuestionInDB = async (user_id, title, body, image_url, tags = []) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Insert question - CHANGE TO author_id
    const questionResult = await client.query(
      `INSERT INTO questions (author_id, title, body, image_url)  
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, title, body, image_url]
    );
    
    const question = questionResult.rows[0];

    // 2. Handle tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Find or create tag
        let tagResult = await client.query(
          'SELECT id FROM tags WHERE name = $1',
          [tagName.toLowerCase()]
        );

        let tagId;
        if (tagResult.rows.length === 0) {
          // Create new tag
          const newTagResult = await client.query(
            'INSERT INTO tags (name) VALUES ($1) RETURNING id',
            [tagName.toLowerCase()]
          );
          tagId = newTagResult.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }

        // Link tag to question
        await client.query(
          'INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2)',
          [question.id, tagId]
        );
      }
    }

    await client.query('COMMIT');
    return question;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

//  Get trending questions 
export const getTrendingQuestionsFromDB = async (timeFilter = 'week') => {
  let timeWhere = '';
  const now = new Date();
  
  switch (timeFilter) {
    case 'today':
      timeWhere = `AND q.created_at >= CURRENT_DATE`;
      break;
    case 'week':
      timeWhere = `AND q.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      break;
    case 'month':
      timeWhere = `AND q.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
      break;
    default:
      timeWhere = `AND q.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
  }

  const result = await pool.query(`
    SELECT 
      q.*,
      u.name AS author_name,
      u.avatar_url AS avatar_url,
      COUNT(DISTINCT a.id) AS answers_count,
      COALESCE(SUM(CASE 
        WHEN v.vote_type = 'upvote' THEN 1 
        WHEN v.vote_type = 'downvote' THEN -1 
        ELSE 0 END), 0) AS votes_count,
      q.views_count,
      ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags,
      -- Trending score calculation
      (
        (COALESCE(SUM(CASE 
          WHEN v.vote_type = 'upvote' THEN 1 
          WHEN v.vote_type = 'downvote' THEN -1 
          ELSE 0 END), 0) * 3) +
        (COUNT(DISTINCT a.id) * 2) +
        (q.views_count * 0.1) +
        (CASE WHEN q.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 5 ELSE 0 END)
      ) AS trending_score
    FROM questions q
    LEFT JOIN users u ON q.author_id = u.id  
    LEFT JOIN answers a ON a.question_id = q.id
    LEFT JOIN votes v ON v.answer_id = a.id
    LEFT JOIN question_tags qt ON qt.question_id = q.id
    LEFT JOIN tags t ON t.id = qt.tag_id
    WHERE 1=1 ${timeWhere}
    GROUP BY q.id, u.name, u.avatar_url
    ORDER BY trending_score DESC, q.created_at DESC
    LIMIT 50
  `);
  return result.rows;
};

// Update a question - NO CHANGE NEEDED
export const updateQuestionInDB = async (id, title, body, image_url) => {
  const result = await pool.query(
    `UPDATE questions
     SET title = COALESCE($1, title),
         body = COALESCE($2, body),
         image_url = COALESCE($3, image_url),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [title, body, image_url, id]
  );
  return result.rows[0];
};

// Delete question - NO CHANGE NEEDED
export const deleteQuestionInDB = async (id) => {
  await pool.query(`DELETE FROM questions WHERE id = $1`, [id]);
  return { message: 'Question deleted successfully' };
};