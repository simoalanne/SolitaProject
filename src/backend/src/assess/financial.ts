import { type FinancialRisk } from "@myorg/shared";

export const getFinancialRiskForCompany = async (
  businessId: string
): Promise<FinancialRisk> => {
  // Placeholder code. this needs actual financial stats for the company
  const randomVal = Math.random();
  if (randomVal < 0.33) return "low";
  if (randomVal < 0.66) return "medium";
  return "high";
};