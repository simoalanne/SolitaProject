import {
  type ProjectAssesmentConfiguration,
  type ProjectOutput,
} from "../../../shared/schema.ts";

const makeWeight = (defaultValue: number) => ({
  value: defaultValue,
  min: 0.5,
  max: 10,
  step: 0.5,
});
  
const baseProjectAssessmentConfig: NonNullable<ProjectAssesmentConfiguration> =
  {
    financialRisk: {
      consecutiveLosses: {
        maxAllowedLossYears: { value: 2, min: 0, max: 5, step: 1 },
        startingIndex: { value: 1, min: 0, max: 4, step: 1 },
        weight: makeWeight(3),
        perform: true,
        readOnly: false,
      },
      lowProfitMargin: {
        minMarginPercent: { value: 0.05, min: 0, max: 1, step: 0.01 },
        weight: makeWeight(2),
        perform: true,
        readOnly: false,
      },
      highProfitVolatility: {
        maxVolatilityPercent: { value: 0.3, min: 0, max: 1, step: 0.01 },
        weight: makeWeight(2),
        perform: true,
        readOnly: false,
      },
      highRevenueVolatility: {
        maxVolatilityPercent: { value: 0.2, min: 0, max: 1, step: 0.01 },
        weight: makeWeight(2),
        perform: true,
        readOnly: false,
      },
      profitNotGrowing: {
        consecutiveYearsWithoutGrowth: { value: 3, min: 0, max: 5, step: 1 },
        weight: makeWeight(1),
        perform: true,
        readOnly: false,
      },
      revenueNotGrowing: {
        consecutiveYearsWithoutGrowth: { value: 3, min: 0, max: 5, step: 1 },
        weight: makeWeight(1),
        perform: true,
        readOnly: false,
      },
      swingsInRevenue: {
        maxSwingsThreshold: { value: 2, min: 0, max: 5, step: 1 },
        consideredASwingThreshold: { value: 0.1, min: 0, max: 1, step: 0.01 },
        weight: makeWeight(1),
        perform: true,
        readOnly: false,
      },
      swingsInProfit: {
        maxSwingsThreshold: { value: 2, min: 0, max: 5, step: 1 },
        consideredASwingThreshold: { value: 0.1, min: 0, max: 1, step: 0.01 },
        weight: makeWeight(1),
        perform: true,
        readOnly: false,
      },
      unrealisticBudget: {
        budgetToRevenueRatio: { value: 2, min: 0.5, max: 5, step: 0.1 },
        weight: makeWeight(1),
        perform: true,
        readOnly: false,
      },
      noFinancialData: { weight: makeWeight(1), readOnly: true },
      noValidRevenueData: { weight: makeWeight(1), readOnly: true },
    },
    fundingHistory: {
      recentGrant: {
        minTimeAgo: { value: 3, min: 0, max: 10, step: 1 },
        weight: makeWeight(3),
        perform: true,
        readOnly: false,
      },
      multipleFundingInstances: {
        minTimes: { value: 2, min: 0, max: 20, step: 1 },
        weight: makeWeight(3),
        perform: true,
        readOnly: false,
      },
      mostlyGrants: {
        grantThreshold: { value: 0.7, min: 0, max: 1, step: 0.01 },
        weight: makeWeight(1),
        perform: true,
        readOnly: false,
      },
      oneFundingSignificantToRevenue: {
        percentageOfRevenue: { value: 0.1, min: 0, max: 1, step: 0.01 },
        weight: makeWeight(2),
        perform: true,
        readOnly: false,
      },
      oneFundingSignificantToTotal: {
        percentageOfTotalFunding: { value: 0.5, min: 0, max: 1, step: 0.01 },
        weight: makeWeight(1),
        perform: false,
        readOnly: false,
      },
      steadyFundingGrowth: {
        growthYearsThreshold: { value: 0.7, min: 0, max: 1, step: 0.01 },
        weight: makeWeight(1.5),
        perform: true,
        readOnly: false,
      },
      noFundingHistory: { weight: makeWeight(1), readOnly: true },
    },
    weights: {
      company: {
        financialRisk: makeWeight(5),
        fundingHistory: makeWeight(3),
        descriptionClarity: makeWeight(1),
        descriptionRelevancy: makeWeight(1),
      },
      project: {
        allCompanyEvaluations: makeWeight(7),
        strategicFit: makeWeight(1.5),
        innovation: makeWeight(1.5),
      },
    },
  } as const;

export const createOutputConfig = (
  companyBudgets: { id: string; budget: number }[]
): ProjectOutput["metadata"]["usedConfiguration"] => {
  const totalBudget = companyBudgets.reduce(
    (sum, { budget }) => sum + budget,
    0
  );
  const perCompanyWeights: Record<string, number> = companyBudgets.reduce(
    (acc, { id, budget }) => {
      acc[id] = budget / totalBudget;
      return acc;
    },
    {}
  );

  return {
    financialRisk: {
      ...baseProjectAssessmentConfig.financialRisk,
    },
    fundingHistory: {
      ...baseProjectAssessmentConfig.fundingHistory,
    },
    weights: {
      ...baseProjectAssessmentConfig.weights,
      perCompany: perCompanyWeights,
    },
  };
};

export default baseProjectAssessmentConfig;
