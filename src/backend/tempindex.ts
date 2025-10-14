import express from "express";
import {
  ProjectInputSchema,
  ProjectOutputSchema,
  type ProjectOutput,
} from "../shared/schema.ts";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
const ai = new GoogleGenAI({});

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const frontendPath = resolve(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

app.post("/assess", async (req, res) => {
  try {
    // Validate the incoming request against the ProjectInputSchema
    const projectInput = ProjectInputSchema.parse(req.body);

    // generate ai response using Gemini
    const reply = await ai.models.generateContent({
      model: process.env.GOOGLE_GEMINI_MODEL || "gemini-2.0-flash",
      contents: `review following business idea and give few short 1-3 sentences feedback from novelty and "strategic fit" perspective. 
                Strategic fit means how well the project aligns with a Business Finland's goals and priorities. 
                Here is the idea: ${projectInput.project.description}`,
    });

    const text = reply.text || "AI Connection failed";
    const exampleOutput: ProjectOutput = {
      success: {
        successProbability: 0.75,
        trafficLight: "green",
      },
      companyRisks: Object.fromEntries(
        projectInput.consortium.memberBusinessIds
          .concat(projectInput.consortium.leadApplicantBusinessId)
          .map((id) => [
            id,
            {
              financialRisk: "low",
              businessFinlandFundingHistory: "medium",
            },
          ])
      ),
      llmFeedback: text,
    };
    // Validate the output against the ProjectOutputSchema
    const validatedOutput = ProjectOutputSchema.parse(exampleOutput);

    // Send the validated output as the response
    res.json(validatedOutput);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If validation fails, send a 400 response with the validation errors
      res.status(400).json({ errors: error.errors });
    } else {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

// Fallback that ensures SPA routes work correctly
app.get("/*splat", (_, res) => {
  res.sendFile(join(frontendPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
