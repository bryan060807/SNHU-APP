/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

// 1. Grab the key with a fallback string to prevent initialization crash
const VITE_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 2. Only initialize if the key exists
const genAI = VITE_KEY ? new GoogleGenAI(VITE_KEY) : null;

/**
 * AI-powered title improvement
 */
export async function improveAssignmentTitle(title: string): Promise<string> {
  if (!genAI) {
    console.error("Gemini API Key missing. Ensure VITE_GEMINI_API_KEY is set in Vercel.");
    return title;
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`Rephrase this SNHU assignment title to be professional: "${title}". Return ONLY the title.`);
    return result.response.text().replace(/^"|"$/g, '');
  } catch (error) {
    return title;
  }
}

/**
 * Parses Syllabus text
 */
export async function parseSyllabus(text: string, startDate?: string) {
  if (!genAI) throw new Error("API Key not configured.");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Extract SNHU course info and assignments from: ${text}. Term start: ${startDate || '2026'}. Return JSON with courseCode, courseName, termStartDate, and assignments array.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    return JSON.parse(result.response.text());
  } catch (error) {
    throw new Error("AI extraction failed.");
  }
}

// ... Keep your other functions (getStudyAdvice, generateSpeech) but wrap them in the same `if (!genAI)` check.