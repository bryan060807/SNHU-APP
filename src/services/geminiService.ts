/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, Modality } from "@google/genai";

// 1. Vite/Vercel Environment Variable Access
// NOTE: Must be named VITE_GEMINI_API_KEY in your Vercel Settings
const VITE_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 2. Safe initialization to prevent "Uncaught Error" on script load
const genAI = (typeof VITE_KEY === 'string' && VITE_KEY.length > 10) 
  ? new GoogleGenAI(VITE_KEY) 
  : null;

/**
 * Internal helper to safely get the model. 
 * If the key is missing, it logs a clear error instead of crashing the UI.
 */
const getSafeModel = (modelName: string = "gemini-1.5-flash") => {
  if (!genAI) {
    console.warn("SNHU Compass AI: VITE_GEMINI_API_KEY is missing or invalid. Check Vercel Environment Variables.");
    return null;
  }
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * AI-powered title improvement for the AssignmentList
 */
export async function improveAssignmentTitle(title: string): Promise<string> {
  const model = getSafeModel();
  if (!model) return title;

  try {
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
 * Handles the 8-week module structure and Monday term starts.
 */
export async function parseSyllabus(text: string, startDate?: string) {
  const model = getSafeModel();
  if (!model) throw new Error("AI Service not configured.");

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

  try {
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
  const model = getSafeModel();
  if (!model) return { text: "AI Buddy is currently offline. Please configure your API key.", functionCalls: undefined };

  const systemInstruction = `You are the SNHU Academic Compass AI, a specialized study mentor.
  Context:
  - SNHU follows an 8-week term structure.
  - Thursday 11:59 PM: Discussion Initial Posts.
  - Sunday 11:59 PM: Responses & Assignments.
  - Use the 7-3-1 rule (7 hours of study per credit).
  
  Format: Use Markdown. Be encouraging and focus on resilience and mental health.`;

  const contents = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  contents.push({ role: 'user', parts: [{ text: prompt }] });

  try {
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
      text: "I'm having trouble connecting to my academic database right now.",
      functionCalls: undefined
    };
  }
}

/**
 * Generates speech for 'Talk Mode' using Gemini TTS
 */
export async function generateSpeech(text: string, voiceName: string = 'Kore') {
  const model = getSafeModel("gemini-1.5-flash"); // TTS usually requires flash models
  if (!model) return null;

  try {
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