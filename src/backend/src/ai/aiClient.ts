import { GoogleGenAI } from "@google/genai";
import { Logger } from "../utils/logger.ts"
import {
  type LLMProjectAssessment,
  LLMProjectAssessmentSchema,
} from "../../../shared/schema.ts";

const ai = new GoogleGenAI({}); // Requires valid GEMINI_API_KEY env variable to work

/**
 * Generates feedback on the likelyhood of a company receiving financing.
 *
 * Uses the Google Gemini API to call an AI that reviews given company data
 * which then returns feedback on the likelyhood of the company receiving financing
 * in a JSON format.
 * @param projectDescription - a short description of the project the ai uses as context
 * @returns The AI Response as a promise.
 */
const generateFeedback = async (
  projectDescription: string
): Promise<LLMProjectAssessment> => {
  try {
    /* context for strategic fit could just be hardcoded by pasting stuff from
       https://www.businessfinland.fi/en/for-finnish-customers/services/programs
    */
    const prompt = `Review the following business idea from a novelty and "strategic fit" perspective. 
    Strategic fit means how well the project aligns with a Business Finland's goals and priorities. 
    Here is the Business idea: ${projectDescription}`;

    const response = await ai.models.generateContent({
      model: process.env.GOOGLE_GEMINI_MODEL || "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const aiResponse = LLMProjectAssessmentSchema.parse(
      JSON.parse(response.text)
    );
    // The responses could be logged here before returning the response
    Logger.info(aiResponse);
    return aiResponse;
  } catch (error) {
    console.error("Error accessing Gemini API:", error);
    throw error;
  }
};

// This schema enforces that the AI responses in the expected format
const responseSchema = {
  type: "object",
  properties: {
    innovationTrafficLight: {
      type: "string",
      enum: ["green", "yellow", "red"],
      description:
        "(green=best, red=worst) traffic light indicating level of innovation",
    },
    strategicFitTrafficLight: {
      type: "string",
      enum: ["green", "yellow", "red"],
      description:
        "(green=best, red=worst) traffic light indicating level of strategic fit",
    },
    feedback: {
      type: "string",
      description: "textual feedback in 1-3 sentences",
    },
  },
  required: ["innovationTrafficLight", "strategicFitTrafficLight", "feedback"],
};

export default generateFeedback;
