// /services/aiService.js - PRODUCTION-READY WITH OPTIMIZED PROMPTS
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Core prompt (Option A - Balanced, user-facing) - YOUR EXACT PROMPT
const BASE_SYSTEM_PROMPT = `
You are an AI assistant integrated into Nexora — a modern Q&A platform where
users post questions, provide answers, and interact. Your responses must be:
- Helpful, well-structured, and human-friendly
- Concise, professional, and relevant to the given task
- Returned in clean text without unnecessary explanations
If uncertain, ask for clarification.
`;

export class AIService {
  static async geminiCall(taskPrompt, content) {
    // ✅ YOUR ACTUAL GEMINI 2.5 MODELS
    const modelsToTry = [
      "gemini-2.5-flash-preview",      // Your available model
      "gemini-2.5-flash-lite",         // Your available model  
      "gemini-2.5-flash-lite-preview", // Your available model
      "gemini-2.5-pro",                // Your available model
      "gemini-1.5-flash-latest"        // Fallback
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // ✅ YOUR EXACT PROMPT FORMAT
        const finalPrompt = `
${BASE_SYSTEM_PROMPT}

Task: ${taskPrompt}
User Input:
${content}
`;

        const result = await model.generateContent(finalPrompt);
        console.log(`✅ Success with model: ${modelName}`);
        return { success: true, data: result.response.text() };
        
      } catch (error) {
        console.log(`❌ Failed with ${modelName}:`, error.message);
        continue; // Try next model
      }
    }

    return { 
      success: false, 
      error: 'All Gemini 2.5 models failed. Please check available models in Google AI Studio.' 
    };
  }

  static async suggestTags(content) {
    return this.geminiCall(
      "Suggest 5-8 accurate, relevant tags (single words or short phrases only). Return tags separated by commas.",
      content
    );
  }

  static async rewriteTitle(title) {
    return this.geminiCall(
      "Rewrite this title to be clearer, engaging, and concise (max 12 words). Return only the title.",
      title
    );
  }

  static async rewriteDescription(description) {
    return this.geminiCall(
      "Improve this description for better clarity, flow, and structure. Keep it concise and readable.",
      description
    );
  }

  static async rateQuestionQuality(question) {
    return this.geminiCall(
      "Rate this question on a scale of 1-10 and suggest brief improvements. Return as: Rating: X/10 | Suggestions: ...",
      question
    );
  }

  static async detectDuplicates(question) {
    return this.geminiCall(
      "Indicate whether this question seems similar to common Q&A topics and suggest 2-3 possible similar questions.",
      question
    );
  }

  static async quickSummary(content) {
    return this.geminiCall(
      "Provide a quick 2-3 sentence summary.",
      content
    );
  }

  static async autoTranslate(text, targetLang) {
    return this.geminiCall(
      `Translate this clearly into ${targetLang}. Return only the translated text.`,
      text
    );
  }

  static async detectContentType(content) {
    return this.geminiCall(
      "Classify this content: Programming, Science, Relationships, Politics, Hobbies, Health, Education, or Other. Return only the category.",
      content
    );
  }

  static async codeReview(code) {
    return this.geminiCall(
      "Review this code focusing on best practices, performance, readability, and security. Provide concise feedback.",
      code
    );
  }

  static async personalizeFeed(userInterests) {
    return this.geminiCall(
      "Based on these interests, suggest 5 content topics or question types they may like.",
      userInterests
    );
  }

  static async enhanceSearch(query) {
    return this.geminiCall(
      "Rewrite this search query to be more effective and targeted. Return only the improved query.",
      query
    );
  }

  static async bestAnswerSummary(question, answers) {
    return this.geminiCall(
      "Create a clear summary of the best insights from these answers, ensuring relevance to the question.",
      `QUESTION: ${question} | ANSWERS: ${answers}`
    );
  }
}