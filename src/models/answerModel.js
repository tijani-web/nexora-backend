import pool from "../config/db.js";

// ✅ Get all answers
export const getAllAnswers = async () => {
  const result = await pool.query(`
    SELECT 
      a.*, 
      u.name AS author_name,
      u.avatar_url AS avatar_url,
      COALESCE(SUM(CASE 
        WHEN v.vote_type = 'upvote' THEN 1 
        WHEN v.vote_type = 'downvote' THEN -1 
        ELSE 0 END), 0) AS votes_count
    FROM answers a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN votes v ON v.answer_id = a.id
    GROUP BY a.id, u.name, u.avatar_url
    ORDER BY a.created_at DESC
  `);
  return result.rows;
};

// ✅ Get all answers for a specific question
export const getAllAnswersForQuestion = async (questionId) => {
  const result = await pool.query(`
    SELECT 
      a.*, 
      u.name AS author_name,
      u.avatar_url AS avatar_url,
      COALESCE(SUM(CASE 
        WHEN v.vote_type = 'upvote' THEN 1 
        WHEN v.vote_type = 'downvote' THEN -1 
        ELSE 0 END), 0) AS votes_count
    FROM answers a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN votes v ON v.answer_id = a.id
    WHERE a.question_id = $1
    GROUP BY a.id, u.name, u.avatar_url
    ORDER BY a.created_at ASC
  `, [questionId]);
  return result.rows;
};

// Get answers by question ID (for AI summary)
export const getAnswersByQuestion = async (questionId) => {
  const result = await pool.query(`
    SELECT 
      a.*, 
      u.name AS author_name,
      u.avatar_url AS avatar_url,
      COALESCE(SUM(CASE 
        WHEN v.vote_type = 'upvote' THEN 1 
        WHEN v.vote_type = 'downvote' THEN -1 
        ELSE 0 END), 0) AS votes_count
    FROM answers a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN votes v ON v.answer_id = a.id
    WHERE a.question_id = $1
    GROUP BY a.id, u.name, u.avatar_url
    ORDER BY 
      a.is_accepted DESC,  -- Accepted answers first
      votes_count DESC,     -- Then by votes
      a.created_at ASC      -- Then by creation date
  `, [questionId]);
  return result.rows;
};

// ✅ Get single answer by ID
export const getAnswerById = async (id) => {
  const result = await pool.query(`
    SELECT 
      a.*, 
      u.name AS author_name,
      u.avatar_url AS avatar_url,
      COALESCE(SUM(CASE 
        WHEN v.vote_type = 'upvote' THEN 1 
        WHEN v.vote_type = 'downvote' THEN -1 
        ELSE 0 END), 0) AS votes_count
    FROM answers a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN votes v ON v.answer_id = a.id
    WHERE a.id = $1
    GROUP BY a.id, u.name, u.avatar_url
  `, [id]);
  return result.rows[0];
};

// ✅ Create new answer
export const createAnswerInDB = async (questionId, userId, body, image_url = null) => {
  const result = await pool.query(`
    INSERT INTO answers (question_id, user_id, body, image_url)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [questionId, userId, body, image_url]
  );
  return result.rows[0];
};

// ✅ Update existing answer
export const updateAnswerInDB = async (id, body, image_url = null) => {
  const result = await pool.query(`
    UPDATE answers
    SET body = COALESCE($1, body),
        image_url = COALESCE($2, image_url),
        updated_at = NOW()
    WHERE id = $3
    RETURNING *`,
    [body, image_url, id]
  );
  return result.rows[0];
};

// ✅ Delete answer
export const deleteAnswerInDB = async (id) => {
  await pool.query(`DELETE FROM answers WHERE id = $1`, [id]);
  return { message: "Answer deleted successfully" };
};
