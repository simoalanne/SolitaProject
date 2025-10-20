import { GoogleGenAI } from "@google/genai";
import { type ProjectInput } from "../../../shared/schema.ts";
import type { AIResponse } from "./types.ts";

const ai = new GoogleGenAI({});

// Not clear yet what data is passed here so this may change
/**
 * Generates feedback on the likelyhood of a company receiving financing.
 * 
 * Uses the Google Gemini API to call an AI that reviews given company data
 * which then returns feedback on the likelyhood of the company receiving financing
 * in a JSON format.
 * @param projectInput Contains the data of the company to be reviewed.
 * @returns The AI Response as a promise.
 */
const generateFeedBack = async (projectInput: ProjectInput): Promise<AIResponse> => {
  const expectedJson: string = JSON.stringify({
    innovationScore: "number between 0 and 1",
    strategicFitScore: "number between 0 and 1",
    feedback: "textual feedback in 1-3 sentences",
  });
  try {
    // TODO: More context especially about what is "strategic fit"
    const prompt = `review following business idea from novelty and "strategic fit" perspective. 
                Strategic fit means how well the project aligns with a Business Finland's goals and priorities. 
                Return your answer in JSON format exactly as follows: ${expectedJson} Do not return anything else than JSON.
                Here is the Business idea: ${projectInput.project.description}`;
    // TODO: check here https://ai.google.dev/gemini-api/docs/structured-output how to enforce structured output
    const response = await ai.models.generateContent({
      model: process.env.GOOGLE_GEMINI_MODEL || "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    const aiResponse = JSON.parse(response.text) as AIResponse;
    console.log("AI response:", aiResponse);
    return aiResponse;
  } catch (error) {
    console.error("Error accessing Gemini API:", error);
    throw error;
  }
};

export default generateFeedBack;
