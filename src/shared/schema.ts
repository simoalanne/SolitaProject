import { z, type ZodSchema } from "zod";

/** Standardized error codes for validation failures. */
export const errorCodes = {
  INVALID_BUSINESS_ID_FORMAT: "INVALID_BUSINESS_ID_FORMAT",
  INVALID_BUSINESS_ID_CHECK_DIGIT: "INVALID_BUSINESS_ID_CHECK_DIGIT",
  BUSINESS_IDS_NOT_UNIQUE: "BUSINESS_IDS_NOT_UNIQUE",
  BUSINESS_IDS_REQUIRED: "BUSINESS_IDS_REQUIRED",
  INVALID_PROJECT_BUDGET: "INVALID_PROJECT_BUDGET",
  INVALID_REQUESTED_FUNDING: "INVALID_REQUESTED_FUNDING",
  REQUESTED_FUNDING_EXCEEDS_BUDGET: "REQUESTED_FUNDING_EXCEEDS_BUDGET",
  DESCRIPTION_TOO_LONG: "DESCRIPTION_TOO_LONG",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

/**
 * Validates given input against the provided Zod schema.
 * @param input - The input data to validate.
 * @param validateAgainst - The Zod schema to validate against.
 * @returns An object containing either the validated input and null errors,
 *          or null input and an array of error messages.
 * @example
 * const result = validateInput(someData, SomeZodSchema);
 * if (result.error) {
 *   // handle error
 * } else {
 *   // input is guaranteed to be valid and of type T here
 * }
 */
export const validateInput = <T>(
  input: unknown,
  validateAgainst: ZodSchema<T>
) => {
  const parseResult = validateAgainst.safeParse(input);
  const allErrors =
    parseResult.error?.issues.map(
      (i) => errorCodes[i.message as keyof typeof errorCodes]
    ) || errorCodes.UNKNOWN_ERROR;
  return parseResult.success
    ? { input: parseResult.data as T, errors: null }
    : { input: null, errors: allErrors };
};

// rules from: https://www.vero.fi
export const businessIdSchema = z
  .string()
  .regex(/^(\d{7})-(\d)$/, { message: errorCodes.INVALID_BUSINESS_ID_FORMAT })
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
    { message: errorCodes.INVALID_BUSINESS_ID_CHECK_DIGIT }
  );

const ConsortiumSchema = z
  .array(businessIdSchema)
  .min(1, { message: errorCodes.BUSINESS_IDS_REQUIRED })
  .refine((arr) => new Set(arr).size === arr.length, {
    message: errorCodes.BUSINESS_IDS_NOT_UNIQUE,
  });

const Project = z
  .object({
    budget: z
      .number()
      .nonnegative({ message: errorCodes.INVALID_PROJECT_BUDGET }),
    requestedFunding: z
      .number()
      .nonnegative({ message: errorCodes.INVALID_REQUESTED_FUNDING }),
    description: z
      .string()
      .max(200, { message: errorCodes.DESCRIPTION_TOO_LONG }),
  })
  .refine((data) => data.requestedFunding <= data.budget, {
    message: errorCodes.REQUESTED_FUNDING_EXCEEDS_BUDGET,
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
