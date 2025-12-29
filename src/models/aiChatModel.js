// /models/chatModel.js - CHAT DATABASE MODELS
import pool from '../config/db.js';

export const ChatModel = {
  // Create new conversation
  createConversation: async (userId, title = 'New Chat') => {
    const result = await pool.query(
      `INSERT INTO chat_conversations (user_id, title) 
       VALUES ($1, $2) 
       RETURNING *`,
      [userId, title]
    );
    return result.rows[0];
  },

  // Get user's conversations
  getUserConversations: async (userId, limit = 20) => {
    const result = await pool.query(
      `SELECT id, title, created_at, updated_at 
       FROM chat_conversations 
       WHERE user_id = $1 
       ORDER BY updated_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  // Add message to conversation
  addMessage: async (conversationId, role, content, tokens = 0) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Add the message
      const messageResult = await client.query(
        `INSERT INTO chat_messages (conversation_id, role, content, tokens_used) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [conversationId, role, content, tokens]
      );

      // Update conversation timestamp
      await client.query(
        `UPDATE chat_conversations 
         SET updated_at = NOW() 
         WHERE id = $1`,
        [conversationId]
      );

      await client.query('COMMIT');
      return messageResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get conversation with messages
  getConversation: async (conversationId, userId) => {
    // Verify conversation belongs to user and get messages
    const result = await pool.query(
      `SELECT 
         c.id, c.title, c.created_at, c.updated_at,
         m.id as message_id, m.role, m.content, m.created_at as message_created_at
       FROM chat_conversations c
       LEFT JOIN chat_messages m ON c.id = m.conversation_id
       WHERE c.id = $1 AND c.user_id = $2
       ORDER BY m.created_at ASC`,
      [conversationId, userId]
    );

    if (result.rows.length === 0) return null;

    // Format the response
    const conversation = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at,
      messages: result.rows
        .filter(row => row.message_id) // Only rows with messages
        .map(row => ({
          id: row.message_id,
          role: row.role,
          content: row.content,
          created_at: row.message_created_at
        }))
    };

    return conversation;
  },

  // Update conversation title
  updateConversationTitle: async (conversationId, title) => {
    const result = await pool.query(
      `UPDATE chat_conversations 
       SET title = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [title, conversationId]
    );
    return result.rows[0];
  },

  // Delete conversation
  deleteConversation: async (conversationId, userId) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete messages first (foreign key constraint)
      await client.query(
        'DELETE FROM chat_messages WHERE conversation_id = $1',
        [conversationId]
      );

      // Delete conversation
      await client.query(
        'DELETE FROM chat_conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get recent messages for context (last 10 messages)
  getRecentMessages: async (conversationId, limit = 10) => {
    const result = await pool.query(
      `SELECT role, content 
       FROM chat_messages 
       WHERE conversation_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [conversationId, limit]
    );
    return result.rows.reverse(); // Return in chronological order
  }
};