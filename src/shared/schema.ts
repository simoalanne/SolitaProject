import { z, type ZodSchema } from "zod";

/** Standardized error codes for validation failures. */
export const errorCodes = {
  INVALID_BUSINESS_ID_FORMAT: "INVALID_BUSINESS_ID_FORMAT",
  INVALID_BUSINESS_ID_CHECK_DIGIT: "INVALID_BUSINESS_ID_CHECK_DIGIT",
  BUSINESS_IDS_NOT_UNIQUE: "BUSINESS_IDS_NOT_UNIQUE",
  REQUESTED_FUNDING_EXCEEDS_BUDGET: "REQUESTED_FUNDING_EXCEEDS_BUDGET",
  TOO_SMALL: "TOO_SMALL", // for numbers
  TOO_BIG: "TOO_BIG",
  TOO_SHORT: "TOO_SHORT", // for strings
  TOO_LONG: "TOO_LONG",
  INVALID_REVENUE_ENTRIES_COUNT: "INVALID_REVENUE_ENTRIES_COUNT",
  INVALID_PROFIT_ENTRIES_COUNT: "INVALID_PROFIT_ENTRIES_COUNT",
  REQUIRED_FIELD_MISSING: "REQUIRED_FIELD_MISSING",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

export type InBetween = { min: number; max: number };

const generalDecsLimits: InBetween = { min: 20, max: 400 };
const projectRoleDescLimits: InBetween = { min: 20, max: 200 };
const budgetLimits: InBetween = { min: 1000, max: 1000000000 };
const requestedFundingLimits: InBetween = { min: 100, max: 1000000000 };

// Frontend can use this to show limits in the UI and ensure that it's in sync
// with the backend validation
export const fieldsMetadata: Record<string, InBetween> = {
  generalDescription: generalDecsLimits,
  projectRoleDescription: projectRoleDescLimits,
  budget: budgetLimits,
  requestedFunding: requestedFundingLimits,
} as const;

// Map some of the common Zod error codes to standardized error codes
const zodMessageToErrorCodeMap = {
  too_small: {
    forNumber: errorCodes.TOO_SMALL,
    forString: errorCodes.TOO_SHORT,
  },
  too_big: { forNumber: errorCodes.TOO_BIG, forString: errorCodes.TOO_LONG },
  invalid_type: {
    forNumber: errorCodes.TOO_SMALL,
    forString: errorCodes.REQUIRED_FIELD_MISSING,
  },
};

const errorEnum = z
  .enum(Object.values(errorCodes) as [string, ...string[]])
  .describe("Standardized error codes for validation failures.");

const ValidationErrorsSchema = z
  .array(
    z
      .object({
        path: z
          .array(z.union([z.string(), z.number()]))
          .describe(
            "Array of path segments leading to the field with the error(s)."
          ),
        errorCodes: z.array(errorEnum),
      })
      .describe(
        "Contains the path to the field with errors and associated error codes."
      )
  )
  .describe("Array of Error objects representing validation failures.");

export type Errors = z.infer<typeof ValidationErrorsSchema>;

/**
 * Validates given input against the provided Zod schema.
 * @param input - The input data to validate.
 * @param validateAgainst - The Zod schema to validate against.
 * @returns An object containing either the validated input and null errors,
 *          or null input and an array of grouped validation errors containing paths and error codes.
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

  if (parseResult.success) {
    return { input: parseResult.data as T, errors: null };
  }

  // Zods build in message is just "too_small" or "too_big" and there's no way
  // to tell if the issue is with a number or string so has to be hardcoded here
  const numericFields = ["budget", "requestedFunding"];

  const groupedErrors = Object.values(
    parseResult.error.issues.reduce((acc, i) => {
      const key = JSON.stringify(i.path);
      const codeOrCodePair = Object.values(errorCodes).includes(
        i.message as ErrorCode
      )
        ? (i.message as ErrorCode)
        : zodMessageToErrorCodeMap[
            i.code as keyof typeof zodMessageToErrorCodeMap
          ] || errorCodes.UNKNOWN_ERROR;
      const code =
        typeof codeOrCodePair === "string"
          ? codeOrCodePair
          : numericFields.includes(i.path[i.path.length - 1] as string)
          ? codeOrCodePair.forNumber
          : codeOrCodePair.forString;

      if (!acc[key]) acc[key] = { path: i.path, errorCodes: [] };
      acc[key].errorCodes.push(code);
      return acc;
    }, {} as Record<string, Errors[number]>)
  );

  return { input: null, errors: groupedErrors };
};

const businessIdRegex = /^(\d{7})-(\d)$/;

// rules from: https://www.vero.fi
export const businessIdSchema = z
  .string()
  .regex(businessIdRegex, { message: errorCodes.INVALID_BUSINESS_ID_FORMAT })
  .refine(
    (val) => {
      // refine will run even if regex fails so to prevent errors need to early return here
      if (!businessIdRegex.test(val)) return false;
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
  )
  .describe("Finnish Business ID (Y-tunnus)");

export const FinancialDataSchema = z
  .object({
    revenues: z
      .array(z.number())
      .length(5, { message: errorCodes.INVALID_REVENUE_ENTRIES_COUNT })
      .describe("Company's revenues over the last five years."),
    profits: z
      .array(z.number())
      .length(5, { message: errorCodes.INVALID_PROFIT_ENTRIES_COUNT })
      .describe("Company's profits over the last five years."),
  })
  .describe(
    "Company's financial data for the last five years. May be left out if not available or don't want to share."
  );

export const ConsortiumItemSchema = z
  .object({
    businessId: businessIdSchema,
    budget: z
      .number()
      .min(budgetLimits.min)
      .describe("Company's share of the project budget in euros."),
    requestedFunding: z
      .number()
      .min(requestedFundingLimits.min)
      .describe("Company's requested funding from Business Finland in euros."),
    projectRoleDescription: z
      .string()
      .min(projectRoleDescLimits.min)
      .max(projectRoleDescLimits.max)
      .describe("Small summary on what is the company's role in the project.")
      .optional(),
    financialData: FinancialDataSchema.optional(),
  })
  .superRefine((item, ctx) => {
    if (item.requestedFunding > item.budget) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: errorCodes.REQUESTED_FUNDING_EXCEEDS_BUDGET,
        path: ["requestedFunding"],
      });
    }
  });

export const ConsortiumSchema = z
  .array(ConsortiumItemSchema)
  .superRefine((arr, ctx) =>
    arr
      .filter((e) => e.businessId !== "")
      .forEach((item, index) => {
        const dupesExist =
          arr.filter((e) => e.businessId === item.businessId).length > 1;
        if (dupesExist) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: errorCodes.BUSINESS_IDS_NOT_UNIQUE,
            path: [index, "businessId"],
          });
        }
      })
  )
  .describe(
    "List of companies participating in the project and their details."
  );

export const ProjectInputSchema = z.object({
  consortium: ConsortiumSchema,
  generalDescription: z
    .string()
    .min(generalDecsLimits.min)
    .max(generalDecsLimits.max)
    .describe("General description of the project proposal."),
});

export const TrafficLightSchema = z
  .enum(["green", "yellow", "red"])
  .describe(
    "traffic light rating indicating the assessment outcome. green = good, yellow = ok, red = bad"
  );
export const FinancialRiskSchema = z
  .enum(["n/a", "low", "medium", "high"])
  .describe(
    "Computed financial risk level of the company based on its financial data."
  );
export const FundingHistorySchema = z
  .enum(["none", "low", "medium", "high"])
  .describe(
    "Describes the past funding the company has received from Business Finland."
  );

export const LLMCompanyRoleAssessmentSchema = z
  .object({
    relevancy: TrafficLightSchema.describe(
      "How well the company's role fits the overall project based on the descriptions provided. Does company add value/expertise to the project, or could they be replaced/dropped without impacting the project significantly?"
    ),
    clarity: TrafficLightSchema.describe(
      "How clear is the company's role in the project based on the description provided. Can someone unfamiliar with the project understand what exactly will the company do in the project?"
    ),
    feedback: z
      .string()
      //.max(250) the llm api does not respect max length currently so it can't be enforced here
      .describe(
        "Short summary feedback on how well does the company fit into the project in English."
      ),
    feedbackFi: z
      .string()
      //.max(250)
      .describe(
        "Short summary feedback on how well does the company fit into the project in Finnish."
      ),
  })
  .describe(
    "Feedback from LLM on a single company's fit into the project. If no description was provided this is omitted."
  );

export const LLMProjectAssessmentSchema = z
  .object({
    innovationTrafficLight: TrafficLightSchema.describe(
      "How innovative the project is based on the description provided. Does the project bring something new to the market or significantly improve existing solutions? Or is something that has been done many times before?"
    ),
    strategicFitTrafficLight: TrafficLightSchema.describe(
      "How well does the project align with Business Finland's goals and priorities based on the description provided. Why should Business Finland fund exactly this project?"
    ),
    feedback: z
      .string()
      //.max(500)
      .describe(
        "Short few sentences feedback on why this project is or is not suitable for Business Finland funding in English."
      ),
    feedbackFi: z
      .string()
      //.max(500)
      .describe(
        "Short few sentences feedback on why this project is or is not suitable for Business Finland funding in Finnish."
      ),
  })
  .describe("Feedback from LLM on the overall project proposal");

export const CompanyEvaluationSchema = z
  .object({
    businessId: businessIdSchema,
    businessFinlandFundingHistory: FundingHistorySchema,
    financialRisk: FinancialRiskSchema,
    llmRoleAssessment: LLMCompanyRoleAssessmentSchema.optional(),
    trafficLight: TrafficLightSchema,
  })
  .describe("Evaluation of a single company within the project consortium.");

export const ProjectOutputSchema = z.object({
  companyEvaluations: z
    .array(CompanyEvaluationSchema)
    .min(1)
    .describe("Evaluations for each company in the project consortium."),
  overallTrafficLight: TrafficLightSchema.describe(
    "Overall traffic light rating for the entire project based on weighted company evaluations based on their budget shares as well as LLM novelty and strategic fit assessments."
  ),
  llmProjectAssessment: LLMProjectAssessmentSchema.optional(),
});

// This exists so backend's openapi.ts can easily add all schemas to docs
export const allSchemas = {
  BusinessId: businessIdSchema,
  FinancialData: FinancialDataSchema,
  Consortium: ConsortiumSchema,
  ProjectInput: ProjectInputSchema,
  TrafficLight: TrafficLightSchema,
  FinancialRisk: FinancialRiskSchema,
  FundingHistory: FundingHistorySchema,
  LLMCompanyRoleAssessment: LLMCompanyRoleAssessmentSchema,
  LLMProjectAssessment: LLMProjectAssessmentSchema,
  CompanyEvaluation: CompanyEvaluationSchema,
  ProjectOutput: ProjectOutputSchema,
  ValidationErrors: ValidationErrorsSchema,
};

/** Unique Finnish Business ID (Y-tunnus) that can be validated for format and check digit. */
export type BusinessId = z.infer<typeof businessIdSchema>;

/** Array of unique Business IDs representing the project consortium. */
export type Consortium = z.infer<typeof ConsortiumSchema>;

export type Company = Consortium[number];

/** Input payload containing consortium business IDs and project details. */
export type ProjectInput = z.infer<typeof ProjectInputSchema>;

/** Output payload including company evaluations and LLM-generated project assessment. */
export type ProjectOutput = z.infer<typeof ProjectOutputSchema>;

export type TrafficLight = z.infer<typeof TrafficLightSchema>;

/** LLM-generated assessment of the project's description in terms of innovation and strategic fit. */
export type LLMProjectAssessment = z.infer<typeof LLMProjectAssessmentSchema>;

/** LLM-generated assessment of a single company's role in the project in terms of relevancy and clarity. */
export type LLMCompanyRoleAssessment = z.infer<
  typeof LLMCompanyRoleAssessmentSchema
>;

/** Evaluation of a single company’s financial health and past funding record. */
export type CompanyEvaluation = z.infer<typeof CompanyEvaluationSchema>;

/** Assessed financial risk level of a company from revenue, profitability, growth etc. perspective. */
export type FinancialRisk = z.infer<typeof FinancialRiskSchema>;

/** Represents the past funding the company has received from Business Finland. */
export type FundingHistory = z.infer<typeof FundingHistorySchema>;
