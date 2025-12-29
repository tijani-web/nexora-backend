// /controllers/chatController.js - PRODUCTION CHAT CONTROLLER
import { AIChatService } from '../services/aiChatService.js';
import { ChatModel } from '../models/aiChatModel.js';

export const aichatController = {
  // Start new conversation
  startConversation: async (req, res) => {
    try {
      const { title } = req.body;
      const userId = req.user.id;

      const conversation = await ChatModel.createConversation(userId, title || 'New Chat');
      
      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Start conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start conversation'
      });
    }
  },

  // Send message to conversation
  sendMessage: async (req, res) => {
    try {
      const { conversationId, message } = req.body;
      const userId = req.user.id;

      if (!message?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      // Verify conversation belongs to user
      const conversation = await ChatModel.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      // Add user message to database
      await ChatModel.addMessage(conversationId, 'user', message);

      // Get recent messages for context (last 8 messages)
      const recentMessages = conversation.messages.slice(-8);
      
      // Generate AI response
      const aiResponse = await AIChatService.generateChatResponse(message, recentMessages);
      
      if (!aiResponse.success) {
        return res.status(500).json({
          success: false,
          message: aiResponse.error || 'Failed to generate AI response'
        });
      }

      // Add assistant response to database
      await ChatModel.addMessage(
        conversationId, 
        'assistant', 
        aiResponse.content, 
        aiResponse.tokens
      );

      // Update conversation title if it's the first message
      if (conversation.messages.length === 0) {
        const title = message.substring(0, 40) + (message.length > 40 ? '...' : '');
        await ChatModel.updateConversationTitle(conversationId, title);
      }

      res.json({
        success: true,
        data: {
          response: aiResponse.content,
          conversationId,
          tokens: aiResponse.tokens
        }
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message'
      });
    }
  },

  // Get user's conversations
  getConversations: async (req, res) => {
    try {
      const userId = req.user.id;
      const conversations = await ChatModel.getUserConversations(userId);
      
      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations'
      });
    }
  },

  // Get specific conversation with messages
  getConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const conversation = await ChatModel.getConversation(conversationId, userId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation'
      });
    }
  },

  // Delete conversation
  deleteConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      await ChatModel.deleteConversation(conversationId, userId);
      
      res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete conversation'
      });
    }
  },

  // Quick chat without conversation history (for simple queries)
  quickChat: async (req, res) => {
    try {
      const { message } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const aiResponse = await AIChatService.quickChat(message);
      
      if (!aiResponse.success) {
        return res.status(500).json({
          success: false,
          message: aiResponse.error || 'Chat service unavailable'
        });
      }

      res.json({
        success: true,
        data: {
          response: aiResponse.content
        }
      });

    } catch (error) {
      console.error('Quick chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process chat message'
      });
    }
  }
};