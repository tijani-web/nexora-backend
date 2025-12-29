// /services/aiChatService.js - PRODUCTION CHAT SERVICE
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// NEXORA CHAT PROMPT - Optimized for conversations
const NEXORA_CHAT_PROMPT = `
You are "Nexa" - the AI assistant for Nexora, a modern Q&A platform.

ABOUT NEXORA:
- Platform for asking questions and providing answers
- Users can vote, bookmark, and use tags
- Focus on knowledge sharing and community

YOUR ROLE AS NEXA:
- Help users create better questions and answers
- Assist with code reviews and technical content
- Guide users on platform features
- Provide helpful, professional responses
- Use markdown formatting for code and lists

RESPONSE STYLE:
- Be friendly but professional
- Keep responses concise but helpful
- Ask clarifying questions when needed
- Use **bold** for emphasis and \`code\` for snippets
- Structure complex answers with bullet points

CONVERSATION CONTEXT:
Previous messages: {{CONTEXT}}

Current user message: {{MESSAGE}}
`;

export class AIChatService {
  static async generateChatResponse(userMessage, conversationHistory = []) {
    const modelsToTry = [
      "gemini-2.5-flash-preview",
      "gemini-2.5-flash-lite", 
      "gemini-2.5-flash-lite-preview",
      "gemini-2.5-pro",
      "gemini-1.5-flash-latest"
    ];

    // Format conversation history for context
    const formattedHistory = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Nexa'}: ${msg.content}`)
      .join('\n\n');

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Chat trying model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: "You are Nexa, a helpful AI assistant for the Nexora Q&A platform."
        });

        // Build the conversation prompt
        const prompt = `
Conversation History:
${formattedHistory}

Current User Message: ${userMessage}

Please respond as Nexa. Be helpful, professional, and focus on assisting with:
- Question/answer creation
- Code reviews and technical help  
- Platform guidance
- Content improvement

Response:`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        
        console.log(`✅ Chat success with model: ${modelName}`);
        
        return {
          success: true,
          content: response.text(),
          tokens: response.usageMetadata?.totalTokenCount || 0,
          model: modelName
        };
        
      } catch (error) {
        console.log(`❌ Chat failed with ${modelName}:`, error.message);
        continue;
      }
    }

    return {
      success: false,
      error: 'All chat models failed'
    };
  }

  // Quick chat for simple responses (uses your existing pattern)
  static async quickChat(message) {
    const modelsToTry = [
      "gemini-2.5-flash-preview",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash-latest"
    ];

    const prompt = `
You are Nexa, AI assistant for Nexora Q&A platform. Respond helpfully and professionally.

User: ${message}

Nexa:`;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        
        return {
          success: true,
          content: result.response.text()
        };
      } catch (error) {
        continue;
      }
    }

    return {
      success: false,
      error: 'Chat service unavailable'
    };
  }
}