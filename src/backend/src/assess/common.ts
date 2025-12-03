import { type Configuration, type Rule } from "@myorg/shared";

type ResolvedRule = {
  result: Rule;
  weight: number;
  perform: boolean;
};

/**
 * Helper to call rule functions and store the result along with other data from config
 * @param fn - The rule function to be called.
 * @param configRule - The configuration rule object
 * @param prefixArgs - Any other arguments the rule function needs before the config params.
 * @returns An object containing the rule result, weight, and perform flag.
 */
export const makeRule = (
  fn: (...args: any[]) => Rule,
  configRule: Configuration["financialRisk" | "fundingHistory"][string],
  ...prefixArgs: any[]
): ResolvedRule => {
  const params = configRule.params
    ? Object.values(configRule.params).map((p) => p.value)
    : [];
  return {
    result: fn(...prefixArgs, ...params),
    weight: configRule.weight,
    perform: configRule.perform,
  };
};

/**
 * Computes the weighted average of items with numeric values.
 * Items with missing values are ignored.
 *
 * @param items - Array of objects with `weight` and numeric `value` between 0 and 1.
 * @returns Weighted percentage as a number between 0 and 1.
 * @throws If any value is out of range [0, 1] or total weight is 0.
 */
export const weightedPercentage = (
  items: { weight: number; value?: number }[]
) => {
  const filtered = items.filter((item) => item.value !== undefined) as {
    weight: number;
    value: number;
  }[];
  const totalWeight = filtered.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) throw new Error("Total weight cannot be zero");

  const sum = filtered.reduce((acc, item) => {
    if (item.value! < 0 || item.value! > 1)
      throw new Error(
        `Weighted percentage received out-of-range value: ${item.value}`
      );
    return acc + item.value! * item.weight;
  }, 0);

  return roundToTwoDecimals(sum / totalWeight);
};

/**
 * Converts a percentage to its corresponding enum value
 * @param percent - The percentage value to convert.
 * @param thresholds - An object mapping enum values to their percentage thresholds.
 * @returns The enum value thats least above the given percentage.
 * @throws If no matching enum value is found.
 */
export const percentageToEnum = <T extends Record<string, number>>(
  percent: number,
  thresholds: T
): keyof T =>
  Object.entries(thresholds)
    .sort((a, b) => a[1] - b[1])
    .find(([_, threshold]) => percent <= threshold)![0];

/**
 * Converts an enum value to its corresponding percentage threshold.
 * @param enumValue - The enum value to convert.
 * @param thresholds - An object mapping enum values to their percentage thresholds.
 * @returns The percentage threshold corresponding to the enum value.
 * @throws If the enum value is not found in the thresholds.
 */
export const enumToPercentage = <T extends Record<string, number>>(
  enumValue: keyof T,
  thresholds: T
): number => Object.entries(thresholds).find(([key]) => key === enumValue)![1];

export type Assessment<K extends string, Code extends string = string> = {
  result: K;
  rawScore: number;
  rules: (Rule & { code: Code })[];
};

/**
 * Creates an assessment based on the provided rules and thresholds. The thresholds must be between 0 and 1.
 * @param rules - An array of resolved rules containing results, weights, and perform flags.
 * @param thresholds - An object mapping assessment categories to their threshold values.
 * @returns An object containing the overall assessment result, raw percentage, and individual rule results.
 */
export const makeAssessment = <
  T extends Record<string, number>,
  K extends keyof T & string = keyof T & string,
  Code extends string = string
>(
  rules: (ResolvedRule & { result: Rule & { code: Code } })[],
  thresholds: T
): Assessment<K, Code> => {
  const scoreMap = { favorable: 1, unfavorable: 0 };
  // the rules are filtered twice because rules with n/a outcome should not affect
  // the score but should still be included in the final output
  const active = rules.filter((r) => r.perform);

  if (active.length === 0) {
    return {
      result: "n/a" as K,
      rawScore: 0,
      rules: [{ code: "noRulesToPerform" as Code, outcome: "n/a" }],
    };
  }

  const scored = active
    .filter((r) => r.result.outcome !== "n/a")
    .map((r) => ({
      value: scoreMap[r.result.outcome],
      weight: r.weight,
    }));
  const percentage = weightedPercentage(scored);
  const result = percentageToEnum(percentage, thresholds) as K;

  return { result, rawScore: percentage, rules: active.map((r) => r.result) };
};

/**
 * Convert a boolean to outcome string
 * @param positive - The boolean value to convert.
 * @returns "favorable" if true, "unfavorable" if false.
 */
export const outcomeFromBool = (positive: boolean): Rule["outcome"] =>
  positive ? "favorable" : "unfavorable";

/**
 * Calculates the average of an array of numbers.
 * @param numbers - An array of numbers.
 * @returns The average of the numbers, or null if the array is empty or falsy.
 */
export const avg = (numbers?: number[]): number | null => {
  if (!numbers || numbers.length === 0) return null;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
};

export const clamp = (num: number, min: number, max: number): number =>
  Math.min(Math.max(num, min), max);

export const roundToTwoDecimals = (num: number): number =>
  Math.round(num * 100) / 100;
