import z from "zod";

const AIResponseSchema = z.object({
  innovationScore: z.number().min(0).max(1), // use for calculations if needed
  strategicFitScore: z.number().min(0).max(1), // use for calculations if needed
  feedback: z.string(), // Pass to frontend as is
});

export type AIResponse = z.infer<typeof AIResponseSchema>;
