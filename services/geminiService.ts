
import { GoogleGenAI } from "@google/genai";
import { MC_BUDGET_DATA } from "../mockData";

// Initialize the Google GenAI SDK with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsight = async (question: string) => {
  try {
    const systemInstruction = `
      You are a fiscal transparency expert for the "Concerned Citizens of MC" (Montgomery County).
      Current Budget Data:
      ${JSON.stringify(MC_BUDGET_DATA, null, 2)}
      
      Instructions:
      1. Provide clear, objective answers based on the budget data.
      2. If the user asks about tax implications, emphasize transparency.
      3. Use a professional, civic-minded tone.
    `;

    // Always use ai.models.generateContent with the model name and contents.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Access the generated text directly from the .text property of the response object.
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble analyzing the data right now. Please try again later.";
  }
};
