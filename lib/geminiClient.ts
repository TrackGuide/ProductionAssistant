import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client (ensure GOOGLE_API_KEY env var is set)
export const gemini = new GoogleGenerativeAI(
  process.env.GOOGLE_API_KEY || ''
);