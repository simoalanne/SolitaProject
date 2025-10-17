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
  .object({
    leadApplicantBusinessId: businessIdSchema,
    memberBusinessIds: z.array(businessIdSchema).default([]),
  })
  .refine(
    (data) => !data.memberBusinessIds.includes(data.leadApplicantBusinessId),
    { message: "Lead applicant cannot also appear in member list." }
  )
  .refine(
    (data) =>
      new Set(data.memberBusinessIds).size === data.memberBusinessIds.length,
    { message: "Member business IDs must be unique." }
  );

const Project = z
  .object({
    budget: z.number().nonnegative(),
    requestedGrant: z.number().nonnegative(),
    description: z.string(),
  })
  .refine((data) => data.requestedGrant <= data.budget, {
    message: "Requested grant cannot exceed the total budget.",
  });

export const ProjectInputSchema = z.object({
  consortium: ConsortiumSchema,
  project: Project,
});

const TrafficLightSchema = z.enum(["green", "yellow", "red"]);

const SuccessSchema = z.object({
  successProbability: z.number().min(0).max(1),
  trafficLight: TrafficLightSchema,
});

const RiskLevelSchema = z.enum(["low", "medium", "high"]);
const FundingHistoryLevelSchema = z.enum(["none", "low", "medium", "high"]);

const CompanyRiskSchema = z.object({
  financialRisk: RiskLevelSchema,
  businessFinlandFundingHistory: FundingHistoryLevelSchema,
});

const companyRisksSchema = z.record(businessIdSchema, CompanyRiskSchema);

export const ProjectOutputSchema = z.object({
  success: SuccessSchema,
  companyRisks: companyRisksSchema,
  llmFeedback: z.string(),
});

// export all types so its easier to work with them in other files
export type BusinessId = z.infer<typeof businessIdSchema>;
export type Consortium = z.infer<typeof ConsortiumSchema>;
export type Project = z.infer<typeof Project>;
export type ProjectInput = z.infer<typeof ProjectInputSchema>;
export type ProjectOutput = z.infer<typeof ProjectOutputSchema>;
export type TrafficLight = z.infer<typeof TrafficLightSchema>;
export type Success = z.infer<typeof SuccessSchema>;
export type CompanyRisk = z.infer<typeof CompanyRiskSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type FundingHistoryLevel = z.infer<typeof FundingHistoryLevelSchema>;
export type CompanyRisks = z.infer<typeof companyRisksSchema>;


