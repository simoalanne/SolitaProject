import {
  type FinancialRisk,
  type Consortium,
  type FinancialRiskRule,
  type ProjectAssesmentConfiguration,
} from "@myorg/shared";

const getOutcome = (positive: boolean): "favorable" | "unfavorable" =>
  positive ? "favorable" : "unfavorable";


export const getFinancialRiskForCompany = (
  companyInfo: Consortium[number],
  config: NonNullable<ProjectAssesmentConfiguration>["financialRisk"]
): { result: FinancialRisk; rules: FinancialRiskRule[] } => {
  if (!companyInfo.financialData)
    return {
      result: "n/a",
      rules: [{ code: "noFinancialData", outcome: "n/a" }],
    };

  const { revenues, profits } = companyInfo.financialData;

  const latestNonZeroRevenue = [...revenues].reverse().find((rev) => rev !== 0);

  // if somehow all revenue data is zero that should automatically flag high risk
  if (latestNonZeroRevenue === 0) {
    return {
      result: "high",
      rules: [{ code: "noValidRevenueData", outcome: "high" }],
    };
  }

  const unrealisticBudget = hasUnrealisticBudgetToRevenueRatio(
    latestNonZeroRevenue!,
    companyInfo.budget,
    2 // budget should be at most 2x latest revenue
  );

  // Unrealistic budget is an automatic high risk too, because it doesn't matter
  // how good other indicators are if the budget is completely out of line relative
  // to the company's financials
  if (unrealisticBudget.outcome === "unfavorable") {
    return {
      result: "high",
      rules: [{ ...unrealisticBudget }],
    };
  }

  const indicators = [
    {
      check: hasManyConsecutiveLosses(
        profits,
        config.consecutiveLosses.startingIndex,
        config.consecutiveLosses.maxAllowedLossYears
      ),
      weight: config.consecutiveLosses.weight,
      perform: config.consecutiveLosses.perform,
    },
    {
      check: hasLowProfitMargin(
        revenues,
        profits,
        config.lowProfitMargin.minMarginPercent
      ),
      weight: config.lowProfitMargin.weight,
      perform: config.lowProfitMargin.perform,
    },
    {
      check: hasHighVolatility(
        profits,
        config.highProfitVolatility.maxVolatilityPercent,
        "highProfitVolatility"
      ),
      weight: 2,
      perform: config.highProfitVolatility.perform,
    },
    {
      check: hasFailedToGrow(
        profits,
        config.profitNotGrowing.consecutiveYearsWithoutGrowth,
        "profitNotGrowing"
      ),
      weight: config.profitNotGrowing.weight,
      perform: config.profitNotGrowing.perform,
    },
    {
      check: hasHighVolatility(
        revenues,
        config.highRevenueVolatility.maxVolatilityPercent,
        "highRevenueVolatility"
      ),
      weight: config.highRevenueVolatility.weight,
      perform: config.highRevenueVolatility.perform,
    },
    {
      check: hasManySwings(
        revenues,
        config.swingsInRevenue.maxSwingsThreshold,
        config.swingsInRevenue.consideredASwingThreshold,
        "swingsInRevenue"
      ),
      weight: config.swingsInRevenue.weight,
      perform: config.swingsInRevenue.perform,
    },
  ].filter((ind) => ind.perform);

  const totalWeight = indicators.reduce((sum, ind) => sum + ind.weight, 0);
  const score = indicators
    .map((ind) => outcomeToNumber(ind.check.outcome) * ind.weight)
    .reduce((sum, val) => sum + val, 0);

  const riskPercentage = 1 - score / totalWeight;

  const rules = indicators.map((indicator) => indicator.check);

  if (riskPercentage >= 0.66) return { result: "high", rules };
  if (riskPercentage >= 0.33) return { result: "medium", rules };
  return { result: "low", rules };
};

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
): Extract<FinancialRiskRule, { code: "unrealisticBudget" }> => {
  const ratio = projectBudget / latestRevenue;
  const positive = ratio <= threshold;
  return {
    code: "unrealisticBudget",
    params: { projectBudget, latestRevenue },
    outcome: getOutcome(positive),
  };
};

const outcomeToNumber = (outcome: FinancialRiskRule["outcome"]): number =>
  ({ neutral: 0.5, unfavorable: 0, favorable: 1 }[outcome]);

const avg = (numbers: number[]): number =>
  numbers.reduce((a, b) => a + b, 0) / numbers.length;

const formatPercent = (value: number): string => `${(value * 100).toFixed(2)}%`;

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
): Extract<FinancialRiskRule, { code: "consecutiveLosses" }> => {
  let consecutive = 0;
  const manyLosses = profits
    .slice(startingIndex)
    .some((profit) =>
      profit < 0 ? ++consecutive > maxAllowed : (consecutive = 0)
    );
  const positive = !manyLosses;
  return {
    code: "consecutiveLosses",
    params: { lossYears: consecutive },
    outcome: getOutcome(positive),
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
): Extract<FinancialRiskRule, { code: "lowProfitMargin" }> => {
  const profitRevs = profits.map((profit, i) =>
    revenues[i] === 0 ? 0 : profit / revenues[i]
  );
  const averageMargin = avg(profitRevs);
  const positive = averageMargin >= threshold;
  return {
    code: "lowProfitMargin",
    params: { averageMarginPercent: formatPercent(averageMargin) },
    outcome: getOutcome(positive),
  };
};

/**
 * Calculates the standard deviation of an array of numbers.
 * @param numbers - Array of numbers.
 * @returns The standard deviation of the numbers.
 */
const stddev = (numbers: number[]): number => {
  const mean = avg(numbers);
  const variance =
    numbers.reduce((sum, num) => sum + (num - mean) ** 2, 0) / numbers.length;
  return Math.sqrt(variance);
};

type VolatilityRuleCode = "highRevenueVolatility" | "highProfitVolatility";

/**
 * Checks if the company has high volatility in the given values.
 * @param values - Array of numerical values (e.g., revenues or profits).
 * @param threshold - Threshold for what is considered high volatility.
 * @returns A rule indicating whether the company has high volatility or not.
 */
const hasHighVolatility = (
  values: number[],
  threshold: number,
  code: VolatilityRuleCode
): Extract<FinancialRiskRule, { code: VolatilityRuleCode }> => {
  const growthRates = values
    .slice(1)
    .map((val, i) => (values[i] === 0 ? 0 : (val - values[i]) / values[i]));
  const volatility = stddev(growthRates);
  const positive = volatility <= threshold;

  return {
    code,
    params: {
      volatilityPercent: formatPercent(volatility),
    },
    outcome: getOutcome(positive),
  };
};

type SwingRuleCode = "swingsInRevenue" | "swingsInProfit";

const hasManySwings = (
  values: number[],
  maxSwingsThreshold: number,
  consideredASwingThreshold: number,
  code: SwingRuleCode
): Extract<FinancialRiskRule, { code: SwingRuleCode }> => {
  let swings = 0;
  values.slice(1).forEach((val, i) => {
    const signChanged = Math.sign(val) !== Math.sign(values[i]);
    const swingedEnough =
      Math.abs(val - values[i]) / Math.abs(values[i]) >=
      consideredASwingThreshold;
    if (signChanged && swingedEnough) swings++;
  });

  const positive = swings <= maxSwingsThreshold;
  return {
    code,
    params: {
      swingsCount: swings,
    },
    outcome: getOutcome(positive),
  };
};

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
): Extract<FinancialRiskRule, { code: GrowthRuleCode }> => {
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
    params: { consecutiveYearsWithoutGrowth },
    outcome: getOutcome(positive),
  };
};
