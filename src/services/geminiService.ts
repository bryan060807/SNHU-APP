/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from "@google/genai";

// Vercel/Vite require the VITE_ prefix
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenAI(apiKey);

/**
 * AI-powered title improvement
 */
export async function improveAssignmentTitle(title: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(`Rephrase this SNHU assignment title to be professional and concise: "${title}". Return ONLY the new title.`);
    return result.response.text().replace(/^"|"$/g, '');
  } catch (error) {
    console.error("Improve Title Error:", error);
    return title;
  }
}

/**
 * Parses Syllabus text from PDFs/HTML into SNHU-formatted JSON
 */
export async function parseSyllabus(text: string, startDate?: string) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview"
    });

    const prompt = `Extract course information and assignments from the following SNHU course overview text:
    
    ${text}
    
    ${startDate ? `IMPORTANT: The term starts on ${startDate}. Use this as the base (Module 1 start date) to calculate all assignment due dates.` : ""}
    
    Return a JSON object with:
    - courseCode (e.g., HIS-217)
    - courseName (e.g., US History II)
    - termStartDate (YYYY-MM-DD)
    - assignments (Array with title, dueDate (ISO string), type (discussion, assignment, quiz, project), and estimatedHours).
    
    Note: SNHU terms are 8 weeks. Module 1 starts on the termStartDate. 
    Discussions initial posts: Thursdays 11:59 PM.
    Responses/Assignments: Sundays 11:59 PM.
    Assume year 2026.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    return JSON.parse(responseText || "{}");
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Failed to parse syllabus text.");
  }
}

/**
 * Chat logic for the SNHU Academic Compass AI
 */
export async function getStudyAdvice(prompt: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const systemInstruction = `You are the SNHU Academic Compass AI.
    SNHU Rhythm:
    - Thu 11:59 PM: Discussion Initial Posts.
    - Sun 11:59 PM: Responses & Assignments.
    
    Use Markdown. Bold key deadlines.`;

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
      functionCalls: undefined // Simplified for stability
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "I'm having trouble reaching the AI engine. Check your API key configuration.",
      functionCalls: undefined
    };
  }
}

export async function generateSpeech(text: string, voiceName: string = 'Kore') {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });
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
    console.error("TTS Error:", error);
    return null;
  }
}