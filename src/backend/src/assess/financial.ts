import { type FinancialRisk, type Consortium } from "@myorg/shared";

export const getFinancialRiskForCompany = (
  companyInfo: Consortium[number]
): FinancialRisk => {
  const { revenues, profits } = companyInfo.financialData!;
  if (revenues.length !== 5 || profits.length !== 5)
    return "n/a";

  // All magic numbers should come from a config or env vars later
  // TODO: add more indicators h
  const indicators = [
    hasManyConsecutiveLosses(profits, 1, 2),
    hasLowAvgProfitMargin(revenues, profits, 0.05)
  ];

  const riskPercentage = (indicators.filter(Boolean).length / indicators.length) * 100;
  return determineRiskLevel(riskPercentage);
};

const determineRiskLevel = (riskPercentage: number): FinancialRisk => {
  if (riskPercentage >= 66) return "high";
  if (riskPercentage >= 33) return "medium";
  return "low";
}

const avg = (numbers: number[]): number =>
  numbers.reduce((a, b) => a + b, 0) / numbers.length;

/**
 * Checks if company has not made profits for many consecutive years.
 * @param profits - An array of profit values over consecutive years.
 * @param startingIndex - The index from which to start checking for consecutive losses.
 * @param maxAllowed - Maximum allowed number of consecutive loss years.
 * @return True if the number of consecutive loss years exceeds maxAllowed, false otherwise.
 */
const hasManyConsecutiveLosses = (
  profits: number[],
  startingIndex: number,
  maxAllowed: number
) => {
  let consecutive = 0;
  return profits
    .slice(startingIndex)
    .some((profit) =>
      profit < 0 ? ++consecutive > maxAllowed : (consecutive = 0)
    );
};

const hasLowAvgProfitMargin = (
  revenues: number[],
  profits: number[],
  threshold: number
) => {
  const profitRevs = profits.map((profit, i) =>
    revenues[i] === 0 ? 0 : profit / revenues[i]
  );
  const averageMargin = avg(profitRevs);
  return averageMargin < threshold;
};
