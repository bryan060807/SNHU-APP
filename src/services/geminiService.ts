/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Singleton instance to prevent multiple SDK initializations
let genAIInstance: GoogleGenerativeAI | null = null;

/**
 * Lazy Initialization Helper
 * Ensures the SDK is only instantiated when a user actually triggers an AI action.
 * This effectively shields the browser from "Missing Key" errors on initial boot.
 */
const getSDK = () => {
  if (genAIInstance) return genAIInstance;

  const VITE_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // If the key is missing, we stop here and throw a clean error for the UI to handle.
  if (!VITE_KEY || VITE_KEY === 'undefined' || VITE_KEY.length < 10) {
    throw new Error("AI CONFIG MISSING: VITE_GEMINI_API_KEY is not set in environment.");
  }

  genAIInstance = new GoogleGenerativeAI(VITE_KEY);
  return genAIInstance;
};

/**
 * AI-powered title improvement for the AssignmentList
 */
export async function improveAssignmentTitle(title: string): Promise<string> {
  try {
    const sdk = getSDK();
    // Switched to gemini-1.5-flash-latest for stable API resolution
    const model = sdk.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(
      `Rephrase this SNHU assignment title to be professional and concise: "${title}". Return ONLY the new title text.`
    );
    return result.response.text().replace(/^"|"$/g, '').trim();
  } catch (error) {
    console.error("AI Title Improvement failed:", error);
    return title;
  }
}

/**
 * Parses Syllabus text from PDFs/HTML into SNHU-formatted JSON
 */
export async function parseSyllabus(text: string, startDate?: string) {
  try {
    const sdk = getSDK();
    // Switched to gemini-1.5-flash-latest for stable API resolution
    const model = sdk.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const prompt = `Extract course information and assignments from this SNHU syllabus text:
    
    ${text}
    
    ${startDate ? `IMPORTANT: The term starts on ${startDate}. Use this as the base (Module 1 start date) to calculate all due dates.` : ""}
    
    Return a JSON object strictly following this schema:
    - courseCode (e.g., IT-140)
    - courseName (e.g., Introduction to Scripting)
    - termStartDate (YYYY-MM-DD)
    - assignments (Array with: title, dueDate (ISO string), type (discussion, assignment, quiz, project), estimatedHours).
    
    Note: SNHU terms are 8 weeks. Module 1 starts on the termStartDate. 
    Initial posts are due Thursdays 11:59 PM. Responses/Assignments are due Sundays 11:59 PM.
    Assume year 2026 if not specified.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    return JSON.parse(responseText || "{}");
  } catch (error: any) {
    console.error("Gemini Syllabus Parsing Error:", error);
    // Rethrow with a clean message for the UI Toast
    throw new Error(error.message.includes("API_KEY") 
      ? "AI System Offline: Missing Gemini API Key in Vercel." 
      : "Neural Link failed to structure syllabus data.");
  }
}

/**
 * Chat logic for the SNHU Academic Compass AI Buddy
 */
export async function getStudyAdvice(prompt: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
  try {
    const sdk = getSDK();
    // Switched to gemini-1.5-flash-latest for stable API resolution
    const model = sdk.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const systemInstruction = `You are the SNHU Academic Compass AI. 
    SNHU Rules: Thu 11:59 PM (Initial Post), Sun 11:59 PM (Assignments). 
    Tone: Industrial, focused, supportive. No fluff. Use technical language when appropriate.`;

    const contents = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const result = await model.generateContent({
      contents,
      systemInstruction,
    });
    
    return {
      text: result.response.text(),
      functionCalls: undefined 
    };
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    return {
      text: "Neural link interrupted. System configuration required.",
      functionCalls: undefined
    };
  }
}

/**
 * Talk Mode: TTS using Gemini natively
 */
export async function generateSpeech(text: string, voiceName: string = 'Kore') {
  try {
    const sdk = getSDK();
    // Switched to gemini-1.5-flash-latest for stable API resolution
    const model = sdk.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); 
    const result = await model.generateContent({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"] as any,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }, 
          },
        } as any,
      },
    });

    return result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return null;
  }
}