import { z } from "zod";

// rules from: https://www.vero.fi
export const businessIdSchema = z
  .string()
  .regex(
    /^(\d{7})-(\d)$/,
    "Invalid business ID format. Expected format: 1234567-8"
  )
  .refine(
    (val) => {
      const [digits, checkDigitStr] = val
        .split("-")
        .map((c) => c.split("").map(Number));

      const weights = [7, 9, 10, 5, 8, 4, 2];
      const sum = digits.reduce(
        (acc, digit, idx) => acc + digit * weights[idx],
        0
      );

      const divisor = 11;
      const remainder = sum % divisor;
      // if remainer is 1 it's automatically invalid
      if (remainder == 1) return false;
      // If it's 0 the check digit is 0 else it's 11 - remainder
      const checkDigit = remainder === 0 ? 0 : divisor - remainder;
      return checkDigit === checkDigitStr[0];
    },
    { message: "Invalid business ID check digit." }
  );

const ConsortiumSchema = z
  .array(businessIdSchema)
  .min(1, "At least one business ID is required.")
  .refine((arr) => new Set(arr).size === arr.length, {
    message: "Business IDs must be unique.",
  });

const Project = z
  .object({
    budget: z.number().nonnegative(),
    requestedFunding: z.number().nonnegative(),
    description: z.string(),
  })
  .refine((data) => data.requestedFunding <= data.budget, {
    message: "Requested funding cannot exceed total budget.",
  });

export const ProjectInputSchema = z.object({
  businessIds: ConsortiumSchema,
  project: Project,
});

export const TrafficLightSchema = z.enum(["green", "yellow", "red"]);
export const FinancialRiskSchema = z.enum(["low", "medium", "high"]);
export const FundingHistorySchema = z.enum(["none", "low", "medium", "high"]);

export const CompanyEvaluationSchema = z.object({
  businessId: businessIdSchema,
  financialRisk: FinancialRiskSchema,
  businessFinlandFundingHistory: FundingHistorySchema,
  trafficLight: TrafficLightSchema,
});

export const LLMProjectAssessmentSchema = z.object({
  innovationTrafficLight: TrafficLightSchema,
  strategicFitTrafficLight: TrafficLightSchema,
  feedback: z.string(),
});

export const ProjectOutputSchema = z.object({
  companyEvaluations: z.array(CompanyEvaluationSchema).min(1),
  llmProjectAssessment: LLMProjectAssessmentSchema,
});

/** Unique Finnish Business ID (Y-tunnus) that can be validated for format and check digit. */
export type BusinessId = z.infer<typeof businessIdSchema>;

/** Array of unique Business IDs representing the project consortium. */
export type Consortium = z.infer<typeof ConsortiumSchema>;

/** Core project data including budget, requested funding, and short description of the project. */
export type Project = z.infer<typeof Project>;

/** Input payload containing consortium business IDs and project details. */
export type ProjectInput = z.infer<typeof ProjectInputSchema>;

/** Output payload including company evaluations and LLM-generated project assessment. */
export type ProjectOutput = z.infer<typeof ProjectOutputSchema>;

export type TrafficLight = z.infer<typeof TrafficLightSchema>;

/** LLM-generated assessment of the project's description in terms of innovation and strategic fit. */
export type LLMProjectAssessment = z.infer<typeof LLMProjectAssessmentSchema>;

/** Evaluation of a single company’s financial health and past funding record. */
export type CompanyEvaluation = z.infer<typeof CompanyEvaluationSchema>;

/** Assessed financial risk level of a company from revenue, profitability, growth etc. perspective. */
export type FinancialRisk = z.infer<typeof FinancialRiskSchema>;

/** Represents the past funding the company has received from Business Finland. */
export type FundingHistory = z.infer<typeof FundingHistorySchema>;
