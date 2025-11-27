import { type FinancialRisk, type Consortium, type Rule } from "@myorg/shared";
import type { ProjectAssessmentConfig } from "../config/projectAssesmentConfig.ts";
import {
  makeAssessment,
  makeRule,
  roundToTwoDecimals,
  type Assessment,
} from "./common.ts";
import { outcomeFromBool, avg } from "./common.ts";

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
): Assessment<FinancialRisk> => {
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
    makeRule(hasHighProfitVolatility, config.highProfitVolatility, profits),
    makeRule(hasHighRevenueVolatility, config.highRevenueVolatility, revenues),
    makeRule(hasFailedToGrowProfit, config.profitNotGrowing, profits),
    makeRule(hasFailedToGrowRevenue, config.revenueNotGrowing, revenues),
  ];

  return makeAssessment(rules, financialRiskThresholds);
};

/**
 * Checks that some basic conditions such as data availability and realistic budget are met.
 * if any of these checks fail, returns a financial risk assessment indicating why.
 * @param financialData - The financial data of the company that may or may not actually exist.
 * @param budget - The project budget for the company.
 * @param budgetToRevenueThreshold - Threshold for determining unrealistic budget.
 * @returns An object containing the financial risk and rules if checks fail, otherwise undefined.
 */
const sanityChecks = (
  isStartupOrRDDriven: boolean,
  financialData: Consortium[number]["financialData"],
  budget: number,
  budgetToRevenueThreshold: number
): Assessment<FinancialRisk> | undefined => {
  // 1. Startup or R&D driven companies are instanly marked as n/a to avoid misleading risk assessment.
  // Analysing these companies correctly requires more context and data than what's currently available.
  if (isStartupOrRDDriven) {
    return {
      result: "n/a",
      rawScore: 0,
      rules: [{ code: "startupOrRDDriven", outcome: "n/a" }],
    };
  }

  // 2. If there's no financial data, obviously theres nothing to analyze and risk is n/a
  if (!financialData) {
    return {
      result: "n/a",
      rawScore: 0,
      rules: [{ code: "noFinancialData", outcome: "n/a" }],
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
      rules: [{ code: "noValidRevenueData", outcome: "unfavorable" }],
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
const hasUnrealisticBudgetToRevenueRatio = (
  latestRevenue: number,
  projectBudget: number,
  threshold: number
): Rule => {
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
const hasManyConsecutiveLosses = (
  profits: number[],
  startingIndex: number,
  maxAllowed: number
): Rule => {
  let consecutive = 0;
  const manyLosses = profits
    .slice(startingIndex)
    .some((profit) =>
      profit < 0 ? ++consecutive > maxAllowed : (consecutive = 0)
    );
  const positive = !manyLosses;
  return {
    code: "consecutiveLosses",
    values: { lossYears: { value: consecutive, type: "integer" } },
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
const hasLowProfitMargin = (
  revenues: number[],
  profits: number[],
  threshold: number
): Rule => {
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

type VolatilityRuleCode = "highRevenueVolatility" | "highProfitVolatility";

/**
 * Checks if the company's profit values have high volatility over time.
 * @param profits - Array of profit numbers.
 * @param threshold - Maximum allowed volatility threshold.
 * @returns A rule indicating whether the profit volatility is high or not.
 */
const hasHighProfitVolatility = (profits: number[], threshold: number): Rule =>
  hasHighVolatility(profits, threshold, "highProfitVolatility");

/**
 * Checks if the company's revenue values have high volatility over time.
 * @param revenues - Array of revenue numbers.
 * @param threshold - Maximum allowed volatility threshold.
 * @returns A rule indicating whether the revenue volatility is high or not.
 */
const hasHighRevenueVolatility = (
  revenues: number[],
  threshold: number
): Rule => hasHighVolatility(revenues, threshold, "highRevenueVolatility");

/**
 * General purpose function to check for volatility in given financial values.
 * @param values - Array of numerical values
 * @param threshold - Maximum allowed volatility threshold
 * @param code - code to use in the returned Rule
 * @returns A rule indicating whether the volatility is high or not.
 */
const hasHighVolatility = (
  values: number[],
  threshold: number,
  code: VolatilityRuleCode
): Rule => {
  const growthRates = values
    .slice(1)
    .map((val, i) => (values[i] === 0 ? 0 : (val - values[i]) / values[i]));
  const volatility = stddev(growthRates);
  const positive = volatility <= threshold;

  return {
    code,
    values: {
      volatilityPercent: returnDecimalValue(volatility),
    },
    outcome: outcomeFromBool(positive),
  };
};

const hasFailedToGrowRevenue = (
  revenues: number[],
  thresholdYears: number
): Rule => hasFailedToGrow(revenues, thresholdYears, "revenueNotGrowing");

const hasFailedToGrowProfit = (
  profits: number[],
  thresholdYears: number
): Rule => hasFailedToGrow(profits, thresholdYears, "profitNotGrowing");

type GrowthRuleCode = "revenueNotGrowing" | "profitNotGrowing";

/**
 * Checks if the companys financial values have failed to grow over a specified number of years.
 * @param values - Array of numerical values (e.g., revenues or profits).
 * @param thresholdYears - Number of consecutive years without growth to consider as failure.
 * @returns A rule indicating whether the company has failed to grow or not.
 */
const hasFailedToGrow = (
  values: number[],
  thresholdYears: number,
  code: GrowthRuleCode
): Rule => {
  let consecutiveYearsWithoutGrowth = 0;
  const failed = values
    .slice(1)
    .some((value, i) =>
      value <= values[i]
        ? ++consecutiveYearsWithoutGrowth >= thresholdYears
        : (consecutiveYearsWithoutGrowth = 0)
    );
  const positive = !failed;

  return {
    code,
    values: {
      foundYears: { value: consecutiveYearsWithoutGrowth, type: "integer" },
    },
    outcome: outcomeFromBool(positive),
  };
};
