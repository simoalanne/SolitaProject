import { type ProjectOutput } from "@myorg/shared";
import type { TranslationKey } from "../i18n/translations";
type FinancialRiskRules =
  ProjectOutput["companyEvaluations"][number]["financialRisk"]["rules"];
type FinancialRiskRulesShared =
  ProjectOutput["metadata"]["usedConfiguration"]["financialRisk"];
type FundingHistoryRules =
  ProjectOutput["companyEvaluations"][number]["fundingHistory"]["rules"];
type FundingHistoryRulesShared =
  ProjectOutput["metadata"]["usedConfiguration"]["fundingHistory"];

type Outcome = "favorable" | "unfavorable" | "n/a";

export type AnalysisExplanations = { key: TranslationKey; params?: Record<string, any>; outcome: Outcome }[];

/**
 * Transforms rules and shared rules to easier to work with format
 * based on the provided rules and translation function.
 * @param rules - The rules conserning companies financial risk or funding history
 * @param sharedRules - The shared configuration that provides additional context like thresholds for the rules
 * @returns An array of objects containing key, params, and outcome for each explanation.
 */
export const getExplanations = (
  rules: FinancialRiskRules | FundingHistoryRules,
  sharedRules: FinancialRiskRulesShared | FundingHistoryRulesShared,
  keyPrefix: string
): AnalysisExplanations => {
  const explanations = rules.map((rule) => {
    const sharedRule = sharedRules[rule.code as keyof typeof sharedRules] || {};
    const sharedParams = Object.entries(sharedRule).reduce(
      (acc, [key, value]) => {
        if (["weight", "perform", "readOnly"].includes(key)) return acc;
        const valueField = (value as any).value;
        if (valueField === undefined) return acc;

        acc[key] = valueField;
        return acc;
      },
      {} as Record<string, any>
    );
    const params: Record<string, number | string> = {
      ...((rule as any).params || {}),
      ...sharedParams,
    };
    return { key: `${keyPrefix}.${rule.code}.${rule.outcome}` as TranslationKey, params, outcome: rule.outcome };
  });

  return explanations.sort((a, b) => {
    const outcomeOrder = { favorable: 0, unfavorable: 1, "n/a": 2 };
    return outcomeOrder[a.outcome] - outcomeOrder[b.outcome];
  });
};
