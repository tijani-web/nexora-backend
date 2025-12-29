// /routes/chatRoutes.js - SEPARATE CHAT ROUTES
import express from 'express';
import { aichatController } from '../controllers/aiChatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// 💬 CHAT CONVERSATION MANAGEMENT
router.post('/conversations', aichatController.startConversation);
router.get('/conversations', aichatController.getConversations);
router.get('/conversations/:conversationId', aichatController.getConversation);
router.delete('/conversations/:conversationId', aichatController.deleteConversation);

// 💬 CHAT MESSAGING
router.post('/messages', aichatController.sendMessage);

// 💬 QUICK CHAT (No conversation history)
router.post('/quick-chat', aichatController.quickChat);

export default router;