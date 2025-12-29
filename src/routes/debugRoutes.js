// /routes/debug.js - FIXED VERSION
import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';

const router = express.Router();

router.get('/debug-models', async (req, res) => {
  try {
    console.log('🔑 API Key present:', !!process.env.GEMINI_API_KEY);
    console.log('🔑 Key starts with:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Test with a simple model call instead
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Try to generate content to see if it works
    const testResult = await model.generateContent("Say 'Hello World'");
    const response = testResult.response.text();
    
    console.log('✅ AI Test Successful:', response);
    
    res.json({
      success: true,
      message: 'API Key is working!',
      testResponse: response,
      availableModels: [
        "gemini-pro", 
        "gemini-1.5-flash", 
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest"
      ]
    });
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
    res.json({
      success: false,
      error: error.message,
      suggestion: 'Try different model names in your AI service'
    });
  }
});

export default router;