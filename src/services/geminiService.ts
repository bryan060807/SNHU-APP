/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

// 1. We keep a local reference but DO NOT initialize yet.
// This prevents the SDK from throwing "API Key must be set" on the initial page load.
let genAIInstance: GoogleGenAI | null = null;

/**
 * Lazy Initialization Helper
 * Ensures the SDK is only instantiated when a user actually triggers an AI action.
 */
const getSDK = () => {
  if (genAIInstance) return genAIInstance;

  const VITE_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!VITE_KEY || VITE_KEY.length < 10) {
    console.warn("AI System: VITE_GEMINI_API_KEY is missing. AI features are offline.");
    return null;
  }

  // Only now do we touch the Google SDK
  genAIInstance = new GoogleGenAI(VITE_KEY);
  return genAIInstance;
};

/**
 * AI-powered title improvement for the AssignmentList
 */
export async function improveAssignmentTitle(title: string): Promise<string> {
  const sdk = getSDK();
  if (!sdk) return title;

  try {
    const model = sdk.getGenerativeModel({ model: "gemini-1.5-flash" });
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
  const sdk = getSDK();
  if (!sdk) throw new Error("AI Service not configured.");

  try {
    const model = sdk.getGenerativeModel({ model: "gemini-1.5-flash" });
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

    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error("Gemini Syllabus Parsing Error:", error);
    throw new Error("Failed to parse syllabus. Try pasting the text manually.");
  }
}

/**
 * Chat logic for the SNHU Academic Compass AI Buddy
 */
export async function getStudyAdvice(prompt: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
  const sdk = getSDK();
  if (!sdk) return { text: "AI Buddy is currently offline. Please configure your API key.", functionCalls: undefined };

  try {
    const model = sdk.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // The instructions now come via the prompt injection in AIChat.tsx 
    // to include the Long-Term Memory and Persona settings.
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
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return {
      text: "Neural link interrupted. Check your system configuration.",
      functionCalls: undefined
    };
  }
}

/**
 * Generates speech for 'Talk Mode' using Gemini TTS
 */
export async function generateSpeech(text: string, voiceName: string = 'Kore') {
  const sdk = getSDK();
  if (!sdk) return null;

  try {
    const model = sdk.getGenerativeModel({ model: "gemini-1.5-flash" }); 
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