
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

export const parseQuizText = async (rawText: string, startingLaw: number): Promise<QuizQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse the following text from a Word document into a JSON array of quiz questions. 
    The format in the document is:
    Question?
    Correct Answer
    Incorrect Answer 1
    Incorrect Answer 2
    Incorrect Answer 3
    Incorrect Answer 4

    Ensure the "law" property starts at ${startingLaw} and increments by 1 for each question.
    
    Text to parse:
    ${rawText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            law: { type: Type.INTEGER },
            question: { type: Type.STRING },
            correctAnswer: { type: Type.STRING },
            incorrectAnswers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["law", "question", "correctAnswer", "incorrectAnswers"]
        }
      }
    }
  });

  const jsonStr = response.text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", jsonStr);
    throw new Error("The AI returned an invalid JSON format. Please try again.");
  }
};
