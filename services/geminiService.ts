import { GoogleGenAI, Type } from "@google/genai";
import type { QuizQuestion } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const createSchema = (questionCount: number) => ({
  type: Type.OBJECT,
  properties: {
    quiz: {
      type: Type.ARRAY,
      description: `An array of ${questionCount} quiz questions.`,
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "The text of the quiz question.",
          },
          options: {
            type: Type.ARRAY,
            description: "An array of exactly 4 string options for the question.",
            items: { type: Type.STRING },
            minItems: 4,
            maxItems: 4,
          },
          correctAnswerIndex: {
            type: Type.INTEGER,
            description: "The 0-based index of the correct answer in the 'options' array (0-3).",
          },
        },
        required: ["question", "options", "correctAnswerIndex"],
      },
      minItems: questionCount,
      maxItems: questionCount,
    },
  },
  required: ["quiz"],
});


export async function generateQuizQuestions(topic: string, questionCount: number): Promise<QuizQuestion[]> {
  const prompt = `
    Generate a ${questionCount}-question multiple-choice quiz about the topic: "${topic}".
    For each question, provide 4 distinct answer options labeled A, B, C, D.
    Only one option should be correct.
    Ensure the questions cover a range of difficulty from easy to medium.
    Identify the correct answer for each question using a zero-based index (0 for A, 1 for B, 2 for C, 3 for D).
    The output must be a valid JSON object that adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: createSchema(questionCount),
      },
    });

    const resultText = response.text.trim();
    const resultJson = JSON.parse(resultText);
    
    if (resultJson.quiz && Array.isArray(resultJson.quiz) && resultJson.quiz.length > 0) {
      return resultJson.quiz;
    } else {
      throw new Error("Invalid quiz data structure received from API.");
    }
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error("Failed to generate quiz. Please try a different topic.");
  }
}