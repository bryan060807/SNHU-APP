import { GoogleGenAI, Type, GenerateContentResponse, FunctionDeclaration, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSpeech(text: string, voiceName: string = 'Kore') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
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

export async function parseSyllabus(text: string, startDate?: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Extract course information and assignments from the following SNHU course overview text:
  
  ${text}
  
  ${startDate ? `IMPORTANT: The term starts on ${startDate}. Use this as the base (Module 1 start date) to calculate all assignment due dates.` : ""}
  
  Return a JSON object with:
  - courseCode (e.g., IT-140)
  - courseName (e.g., Introduction to Scripting)
  - termStartDate (The Monday the term starts, in YYYY-MM-DD format. Use ${startDate || "the date found in text"} if available)
  - assignments (An array of objects with title, dueDate (ISO string), type (discussion, assignment, quiz, or project), and estimatedHours).
  
  Note: SNHU terms are 8 weeks. Module 1 starts on the termStartDate. 
  Discussions initial posts are due Thursdays, responses and assignments are due Sundays.
  If the text doesn't specify a year, assume 2026.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseCode: { type: Type.STRING },
            courseName: { type: Type.STRING },
            termStartDate: { type: Type.STRING },
            assignments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  dueDate: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["discussion", "assignment", "quiz", "project"] },
                  estimatedHours: { type: Type.NUMBER },
                },
                required: ["title", "dueDate", "type", "estimatedHours"],
              },
            },
          },
          required: ["courseCode", "courseName", "termStartDate", "assignments"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Failed to parse syllabus text.");
  }
}

export async function getStudyAdvice(prompt: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `You are the SNHU Academic Compass AI, a specialized study buddy for Southern New Hampshire University students. 
  You understand the SNHU rhythm:
  - Discussion initial posts are usually due Thursdays by 11:59 PM.
  - Discussion responses and most assignments are due Sundays by 11:59 PM.
  - SNHU uses the 7-3-1 rule often (7 hours of study per credit).
  
  Help the student break down complex assignments, plan their week, or explain academic concepts. 
  Keep responses encouraging, professional, and focused on SNHU success. 
  Use Markdown for formatting.
  
  You have the ability to update assignment statuses if the student asks (e.g., "I finished my discussion post" or "Mark IT-140 quiz as in progress").`;

  const contents = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  // Add current prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [updateAssignmentStatusDeclaration] }]
      },
    });
    
    return {
      text: response.text,
      functionCalls: response.functionCalls
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "I'm having a bit of trouble connecting to my academic database. Please try again in a moment!",
      functionCalls: undefined
    };
  }
}
