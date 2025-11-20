import { GoogleGenAI } from '@google/genai';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL_NAME;

if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY is not set!');
if (!GEMINI_MODEL_NAME) throw new Error('GEMINI_MODEL_NAME is not set!');

let ai: GoogleGenAI;

if (!(globalThis as any).geminiAI) {
  ai = new GoogleGenAI({
    apiKey: GEMINI_KEY,
    // project: 'your_project',
    // location: 'your_location',
    // apiVersion: 'v1',
  });

  (globalThis as any).geminiAI = ai;
} else {
  ai = (globalThis as any).geminiAI;
}

export async function gemini(contents: any, config = {}) {
  try {
    return await ai.models.generateContent({
      model: GEMINI_MODEL_NAME!,
      contents,
      config,
    });
  } catch (error) {
    console.error('Error generating content with Gemini Flash:', error);
    throw error;
  }
}
