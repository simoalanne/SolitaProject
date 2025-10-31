import { ZodSchema } from "zod";
import { GoogleGenAI } from "@google/genai";
import { Logger } from "../utils/logger.ts";
import {
  type LLMProjectAssessment,
  LLMProjectAssessmentSchema,
  type LLMCompanyRoleAssessment,
  LLMCompanyRoleAssessmentSchema,
} from "../../../shared/schema.ts";
import { generateSchema } from "@anatine/zod-openapi";

const ai = new GoogleGenAI({}); // Requires valid GEMINI_API_KEY env variable to work

/**
 * Helper function to call the Gemini API and return parsed content.
 * @param zodSchema - Zod schema to parse the response into.
 * @param prompt - The prompt to send to the AI model.
 * @returns Parsed response from the AI model that conforms to the provided Zod schema.
 * @throws Will throw an error if API call fails, or JSON parsing or schema validation fails.
 */
const generateContent = async <T>(
  zodSchema: ZodSchema<T>,
  prompt: string
): Promise<T> => {
  const response = await ai.models.generateContent({
    model: process.env.GOOGLE_GEMINI_MODEL || "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: generateSchema(zodSchema),
    },
  });
  Logger.info(response.text);
  return zodSchema.parse(JSON.parse(response.text!));
};

// Right now there are two different prompts and response schemas:
// 1) generateFeedback for overall project assessment. The idea of this is to analyze the project description as a whole.
// 2) generateFeedbackForCompany for assessing how well a specific company fits into the project based on overall project
// description and the company's role description.
// the first will be called once per project, the latter once per company in the consortium.
// this will lead to more api calls and this could be optimized in the future by combining these into as few calls as possible.
// however if that is done then context length limits must be taken into account.

/**
 * Generates feedback on the likelyhood of a company receiving financing.
 *
 * Uses the Google Gemini API to call an AI that reviews given company data
 * which then returns feedback on the likelyhood of the company receiving financing
 * in a JSON format.
 * @param projectDescription - a short description of the project the ai uses as context
 * @returns The AI Response as a promise.
 */
export const generateFeedback = async (
  projectDescription: string
): Promise<LLMProjectAssessment> => {
  /*
    context for strategic fit could just be hardcoded by pasting stuff from
    https://www.businessfinland.fi/en/for-finnish-customers/services/programs
  */
  const prompt = `Review the following business idea from a novelty and "strategic fit" perspective. 
    Strategic fit means how well the project aligns with a Business Finland's goals and priorities. 
    Here is the Business idea: ${projectDescription}`;

  return await generateContent(LLMProjectAssessmentSchema, prompt);
};

/**
 * Generates feedback on how well a company fits a project from given descriptions.
 * @param overallProjectDescription - description of the overall project
 * @param companyRoleDescription - description of the company's role in the project
 * @returns The AI Response as a promise.
 */
export const generateFeedbackForCompany = async (
  overallProjectDescription: string,
  companyRoleDescription: string
): Promise<LLMCompanyRoleAssessment> => {
  const prompt = `Evaluate how well the company fits into the project based on the following descriptions.
    Overall project description: ${overallProjectDescription}
    Company role description: ${companyRoleDescription}`;

  return await generateContent(LLMCompanyRoleAssessmentSchema, prompt);
};

export default generateFeedback;
