/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";

// Vercel/Vite require the VITE_ prefix for client-side environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates speech for the SNHU Compass 'Talk Mode'
 */
export async function generateSpeech(text: string, voiceName: string = 'Kore') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }, 
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}

const updateAssignmentStatusDeclaration: FunctionDeclaration = {
  name: "updateAssignmentStatus",
  description: "Update the status of an assignment (e.g., mark as completed, in-progress, or todo)",
  parameters: {
    type: Type.OBJECT,
    properties: {
      assignmentId: { type: Type.STRING, description: "The unique ID of the assignment" },
      status: { type: Type.STRING, enum: ["todo", "in-progress", "completed"], description: "The new status" }
    },
    required: ["assignmentId", "status"]
  }
};

/**
 * AI-powered title improvement for the AssignmentList
 */
export async function improveAssignmentTitle(title: string): Promise<string> {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(`Rephrase this SNHU assignment title to be professional and concise: "${title}". Return ONLY the new title.`);
    return result.response.text().replace(/^"|"$/g, '');
  } catch (error) {
    return title;
  }
}

/**
 * Parses Syllabus text from PDFs/HTML into SNHU-formatted JSON
 */
export async function parseSyllabus(text: string, startDate?: string) {
  const model = "gemini-3-flash-preview";
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

  try {
    const genModel = ai.getGenerativeModel({ 
      model,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await genModel.generateContent(prompt);
    return JSON.parse(response.response.text() || "{}");
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Failed to parse syllabus text.");
  }
}

/**
 * Chat logic for the SNHU Academic Compass AI
 */
export async function getStudyAdvice(prompt: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `You are the SNHU Academic Compass AI.
  You understand the SNHU rhythm:
  - Thursday 11:59 PM: Discussion Initial Posts.
  - Sunday 11:59 PM: Responses & Assignments.
  - Follow the 7-3-1 rule.
  
  Formatting: Use Markdown. Bold key deadlines.
  Capabilities: You can update assignment statuses via tools.`;

  const contents = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  contents.push({ role: 'user', parts: [{ text: prompt }] });

  try {
    const genModel = ai.getGenerativeModel({ model });
    const response = await genModel.generateContent({
      contents,
      tools: [{ functionDeclarations: [updateAssignmentStatusDeclaration] }],
      systemInstruction,
    });
    
    return {
      text: response.response.text(),
      functionCalls: response.response.functionCalls()
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "Connection to the AI engine was interrupted. Please check your VITE_GEMINI_API_KEY.",
      functionCalls: undefined
    };
  }
}