// /models/aiContentModel.js - UPDATED FOR YOUR CURRENT TABLE STRUCTURE
import pool from '../config/db.js';


// Create or update AI content for any feature
export const upsertAIContent = async (feature_type, source_id, content_text, model_info = {}) => {
  const result = await pool.query(
    `INSERT INTO ai_content (feature_type, source_id, content_text, model_info, source_type, created_at)
     VALUES ($1, $2, $3, $4, 'question', NOW())
     ON CONFLICT (source_id, feature_type) 
     DO UPDATE SET 
       content_text = EXCLUDED.content_text,
       model_info = EXCLUDED.model_info,
       created_at = NOW()
     RETURNING *`,
    [feature_type, source_id, content_text, model_info]
  );
  return result.rows[0];
};

// Get AI content by source ID and feature type
export const getAIContent = async (source_id, feature_type) => {
  const result = await pool.query(
    `SELECT * FROM ai_content 
     WHERE source_id = $1 AND feature_type = $2
     ORDER BY created_at DESC 
     LIMIT 1`,
    [source_id, feature_type]
  );
  return result.rows[0];
};

// Get all AI content for a source
export const getAllAIContentForSource = async (source_id) => {
  const result = await pool.query(
    `SELECT * FROM ai_content 
     WHERE source_id = $1
     ORDER BY created_at DESC`,
    [source_id]
  );
  return result.rows;
};

// Delete AI content
export const deleteAIContent = async (source_id, feature_type) => {
  await pool.query(
    'DELETE FROM ai_content WHERE source_id = $1 AND feature_type = $2',
    [source_id, feature_type]
  );
};