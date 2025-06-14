import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

// Log warning if API key is missing
if (!apiKey) {
  console.warn("API_KEY is not set. Using demo mode - AI features will return placeholder content.");
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(apiKey || "dummy-key");

// Helper function to generate content
export async function generateContent(prompt: string, model = "gemini-pro") {
  try {
    // If no API key, return placeholder content
    if (!apiKey) {
      return {
        text: "This is placeholder content because the API key is not configured.",
        isDemoMode: true
      };
    }
    
    // Generate content using the Gemini API
    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(prompt);
    
    return {
      text: result.response.text(),
      isDemoMode: false
    };
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
}

// Export the genAI instance for direct access if needed
export default genAI;
