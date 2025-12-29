import pool from '../config/db.js';

// ✅ Upsert (insert or update) vote
export const upsertVote = async ({ user_id, answer_id, vote_type }) => {
  const result = await pool.query(`
    INSERT INTO votes (user_id, answer_id, vote_type)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, answer_id)
    DO UPDATE SET vote_type = EXCLUDED.vote_type, created_at = NOW()
    RETURNING *`,
    [user_id, answer_id, vote_type]
  );
  return result.rows[0];
};

// ✅ Remove a vote
export const removeVote = async (user_id, answer_id) => {
  const result = await pool.query(
    `DELETE FROM votes WHERE user_id = $1 AND answer_id = $2 RETURNING *`,
    [user_id, answer_id]
  );
  return result.rows[0];
};

// ✅ Get vote counts for a specific answer
export const getVoteCounts = async (answer_id) => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE vote_type = 'upvote') AS upvotes,
      COUNT(*) FILTER (WHERE vote_type = 'downvote') AS downvotes
    FROM votes
    WHERE answer_id = $1`,
    [answer_id]
  );
  return result.rows[0];
};

// ✅ Get user's specific vote
export const getUserVote = async (user_id, answer_id) => {
  const result = await pool.query(
    `SELECT vote_type FROM votes WHERE user_id = $1 AND answer_id = $2`,
    [user_id, answer_id]
  );
  return result.rows[0]?.vote_type || null;
};
