import {
  type ProjectAssesmentConfiguration,
  type ProjectOutput,
} from "../../../shared/schema.ts";

const baseProjectAssessmentConfig: NonNullable<ProjectAssesmentConfiguration> =
  {
    financialRisk: {
      consecutiveLosses: {
        maxAllowedLossYears: 2,
        startingIndex: 1,
        weight: 0.3,
        perform: true,
      },
      lowProfitMargin: { minMarginPercent: 0.05, weight: 0.2, perform: true },
      highProfitVolatility: {
        maxVolatilityPercent: 0.3,
        weight: 0.2,
        perform: true,
      },
      highRevenueVolatility: {
        maxVolatilityPercent: 0.2,
        weight: 0.1,
        perform: true,
      },
      profitNotGrowing: {
        consecutiveYearsWithoutGrowth: 3,
        weight: 0.2,
        perform: true,
      },
      revenueNotGrowing: {
        consecutiveYearsWithoutGrowth: 3,
        weight: 0.1,
        perform: true,
      },
      swingsInRevenue: {
        maxSwingsThreshold: 2,
        consideredASwingThreshold: 0.1,
        weight: 0.1,
        perform: true,
      },
      swingsInProfit: {
        maxSwingsThreshold: 2,
        consideredASwingThreshold: 0.1,
        weight: 0.1,
        perform: true,
      },
      unrealisticBudget: { budgetToRevenueRatio: 2, weight: 1, perform: true },
    },
    fundingHistory: {
      recentGrant: { minTimeAgo: 3, weight: 0.25, perform: true },
      multipleFundingInstances: { minTimes: 2, weight: 0.25, perform: true },
      mostlyGrants: { grantThreshold: 0.7, weight: 0.125, perform: true },
      oneFundingSignificantToRevenue: {
        percentageOfRevenue: 0.1,
        weight: 0.125,
        perform: true,
      },
      oneFundingSignificantToTotal: {
        percentageOfTotalFunding: 0.5,
        weight: 0.125,
        perform: false,
      },
      steadyFundingGrowth: {
        growthYearsThreshold: 0.7,
        weight: 0.125,
        perform: true,
      },
    },
    weights: {
      companyFinancialRisk: 0.6,
      companyFundingHistory: 0.2,
      companyDescriptionClarity: 0.1,
      companyDescriptionRelevancy: 0.1,
      allCompanyEvaluations: 0.8,
      projectInnovation: 0.1,
      projectStrategicFit: 0.1,
    },
  } as const;

export const createOutputConfig = (
  companyBudgets: { id: string; budget: number }[]
): ProjectOutput["metadata"] => {
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
    financialRiskRules: {
      ...baseProjectAssessmentConfig.financialRisk,
      noFinancialData: { weight: 1 },
      noValidRevenueData: { weight: 1 },
    },
    fundingHistoryRules: {
      ...baseProjectAssessmentConfig.fundingHistory,
      noFundingHistory: { weight: 1 },
    },
    weights: {
      ...baseProjectAssessmentConfig.weights,
      perCompany: perCompanyWeights,
    },
  };
};

export default baseProjectAssessmentConfig;
