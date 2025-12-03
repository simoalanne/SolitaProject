import { type FinancialRisk, type Consortium, type Rule } from "@myorg/shared";
import type { ProjectAssessmentConfig } from "../config/projectAssesmentConfig.ts";
import {
  makeAssessment,
  makeRule,
  roundToTwoDecimals,
  clamp,
  type Assessment,
} from "./common.ts";
import { outcomeFromBool, avg } from "./common.ts";

type FinancialRiskCodes = keyof ProjectAssessmentConfig["financialRisk"];
type FinancialRiskRule = Rule & { code: FinancialRiskCodes };
type FinancialRiskAssesment = Assessment<FinancialRisk, FinancialRiskCodes>;

/**
 * Calculates the financial risk assessment for a given company based on its financial data and budget.
 * @param companyInfo - The company information including financial data and budget.
 * @param config - The financial risk configuration parameters.
 * @returns An object containing the overall financial risk and the individual rule results.
 */
export const getFinancialRiskForCompany = (
  companyInfo: Consortium[number],
  config: ProjectAssessmentConfig["financialRisk"],
  financialRiskThresholds: ProjectAssessmentConfig["thresholds"]["financialRisk"]
): FinancialRiskAssesment => {
  const issues = sanityChecks(
    companyInfo.isStartupOrRDDriven,
    companyInfo.financialData,
    companyInfo.budget,
    config.unrealisticBudget.params.budgetToRevenueRatio.value
  );

  if (issues) return issues;

  // financial data is guaranteed to exist here
  const { revenues, profits } = companyInfo.financialData!;

  const rules = [
    makeRule(hasManyConsecutiveLosses, config.consecutiveLosses, profits),
    makeRule(hasLowProfitMargin, config.lowProfitMargin, revenues, profits),
    makeRule(hasHighRevenueVolatility, config.highRevenueVolatility, revenues),
    makeRule(hasFailedToGrowRevenue, config.revenueNotGrowing, revenues),
  ];

  return makeAssessment(
    rules,
    financialRiskThresholds
  ) as FinancialRiskAssesment;
};

/**
 * Checks that some basic conditions such as data availability and realistic budget are met.
 * if any of these checks fail, returns a financial risk assessment indicating why.
 * @param financialData - The financial data of the company that may or may not actually exist.
 * @param budget - The project budget for the company.
 * @param budgetToRevenueThreshold - Threshold for determining unrealistic budget.
 * @returns An object containing the financial risk and rules if checks fail, otherwise undefined.
 */
export const sanityChecks = (
  isStartupOrRDDriven: boolean,
  financialData: Consortium[number]["financialData"],
  budget: number,
  budgetToRevenueThreshold: number
): FinancialRiskAssesment | undefined => {
  // 1. Startup or R&D driven companies are instanly marked as n/a to avoid misleading risk assessment.
  // Analysing these companies correctly requires more context and data than what's currently available.
  if (isStartupOrRDDriven) {
    return {
      result: "n/a",
      rawScore: 0,
      rules: [
        { code: "startupOrRDDriven" as FinancialRiskCodes, outcome: "n/a" },
      ],
    };
  }

  // 2. If there's no financial data, obviously theres nothing to analyze and risk is n/a
  if (!financialData) {
    return {
      result: "n/a",
      rawScore: 0,
      rules: [
        { code: "noFinancialData" as FinancialRiskCodes, outcome: "n/a" },
      ],
    };
  }
  const latestNonZeroRevenue = [...financialData.revenues]
    .reverse()
    .find((rev) => rev !== 0);

  // 3. If the company is not generating any revenue, that is inherently high risk
  if (!latestNonZeroRevenue) {
    return {
      result: "high",
      rawScore: 1,
      rules: [
        {
          code: "noValidRevenueData" as FinancialRiskCodes,
          outcome: "unfavorable",
        },
      ],
    };
  }

  const ruleResult = hasUnrealisticBudgetToRevenueRatio(
    latestNonZeroRevenue,
    budget,
    budgetToRevenueThreshold
  );

  // 4. A budget thats on completely different scale than financials is also inherently high risk
  if (ruleResult.outcome === "unfavorable") {
    return { result: "high", rawScore: 1, rules: [ruleResult] };
  }
};

const returnDecimalValue = (value: number) =>
  ({ value: roundToTwoDecimals(value), type: "decimal" } as const);

/**
 * Checks if the project budget relative to latest revenue is unrealistic.
 * @param latestRevenue - Latest non-zero revenue amount.
 * @param projectBudget - Project budget amount.
 * @param threshold - Threshold for determining unrealistic budget.
 */
export const hasUnrealisticBudgetToRevenueRatio = (
  latestRevenue: number,
  projectBudget: number,
  threshold: number
): FinancialRiskRule => {
  const ratio = projectBudget / latestRevenue;
  const positive = ratio <= threshold;
  return {
    code: "unrealisticBudget",
    values: { ratio: returnDecimalValue(ratio) },
    outcome: outcomeFromBool(positive),
  };
};

/**
 * Checks if there are many consecutive entries with negative profit in the profits array.
 * @param profits - Array of profit numbers.
 * @param startingIndex - Index to start checking from.
 * @param maxAllowed - Maximum allowed consecutive loss years.
 * @returns A rule indicating whether there are many consecutive losses or not.
 */
export const hasManyConsecutiveLosses = (
  profits: number[],
  startingIndex: number,
  maxAllowed: number
): FinancialRiskRule => {
  let currentStreak = 0;
  let maxStreak = 0;
  profits.slice(clamp(startingIndex, 0, profits.length)).forEach((profit) => {
    currentStreak = profit < 0 ? currentStreak + 1 : 0;
    maxStreak = Math.max(maxStreak, currentStreak);
  });
  const positive = maxStreak <= maxAllowed;
  return {
    code: "consecutiveLosses",
    values: { lossYears: { value: maxStreak, type: "integer" } },
    outcome: outcomeFromBool(positive),
  };
};

/**
 * Checks if the average profit margin is below a given threshold.
 * @param revenues - Array of revenue numbers.
 * @param profits - Array of profit numbers.
 * @param threshold - Threshold percentage for low average profit margin.
 * @returns A rule indicating whether the average profit margin is low or not.
 */
export const hasLowProfitMargin = (
  revenues: number[],
  profits: number[],
  threshold: number
): FinancialRiskRule => {
  const profitRevs = profits.map((profit, i) =>
    revenues[i] === 0 ? 0 : profit / revenues[i]
  );
  const averageMargin = avg(profitRevs)!;
  const positive = averageMargin >= threshold;
  return {
    code: "lowProfitMargin",
    values: { averageMarginPercent: returnDecimalValue(averageMargin) },
    outcome: outcomeFromBool(positive),
  };
};

/**
 * Calculates the standard deviation of an array of numbers.
 * @param numbers - Array of numbers.
 * @returns The standard deviation of the numbers.
 */
const stddev = (numbers: number[]): number => {
  const mean = avg(numbers)!;
  const variance =
    numbers.reduce((sum, num) => sum + (num - mean) ** 2, 0) / numbers.length;
  return Math.sqrt(variance);
};

/**
 * Checks if the revenue volatility is higher than the given threshold.
 * @param revenues - Array of revenue numbers.
 * @param threshold - Maximum allowed volatility threshold
 * @returns A rule indicating whether the volatility is high or not.
 */
export const hasHighRevenueVolatility = (
  revenues: number[],
  threshold: number
): FinancialRiskRule => {
  const growthRates = revenues
    .slice(1)
    .map((val, i) =>
      revenues[i] === 0 ? 0 : (val - revenues[i]) / revenues[i]
    );
  const volatility = stddev(growthRates);
  const positive = volatility <= threshold;

  return {
    code: "highRevenueVolatility",
    values: {
      volatilityPercent: returnDecimalValue(volatility),
    },
    outcome: outcomeFromBool(positive),
  };
};

/**
 * Checks if the company has failed to grow revenue for a specified number of consecutive years.
 * @param revenues - Array of revenue numbers.
 * @param thresholdYears - if the number of consecutive years without growth exceeds this, the rule is unfavorable.
 * @param growthRateThreshold - Minimum growth rate to consider as growth.
 * @returns A rule indicating whether the company has failed to grow revenue.
 */
export const hasFailedToGrowRevenue = (
  revenues: number[],
  thresholdYears: number,
  growthRateThreshold: number
): Rule => {
  let currentStreak = 0;
  let maxStreak = 0;
  revenues.slice(1).forEach((rev, i) => {
    currentStreak =
      rev <= revenues[i] * (1 + growthRateThreshold) ? currentStreak + 1 : 0;
    maxStreak = Math.max(maxStreak, currentStreak);
  });

  const positive = maxStreak <= thresholdYears;

  return {
    code: "revenueNotGrowing",
    values: {
      foundYears: { value: maxStreak, type: "integer" },
    },
    outcome: outcomeFromBool(positive),
  };
};
