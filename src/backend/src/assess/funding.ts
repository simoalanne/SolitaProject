import {
  type FundingHistory,
  type FundingRule,
  type ProjectAssesmentConfiguration,
} from "@myorg/shared";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export type FundingEntry = { year: number; amount: number; isLoan: boolean };
export type FundingData = Record<string, FundingEntry[]>;

/**
 * Loads the funding data from the JSON file
 * @returns A promise that resolves to a record mapping Business IDs to past total funding amounts.
 */
const loadFundingData = async (): Promise<FundingData> => {
  try {
    const fileContent = await fs.readFile(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../assets/businessFinlandFundingData.json"
      ),
      "utf-8"
    );
    return JSON.parse(fileContent) as FundingData;
  } catch (error) {
    console.error(
      `Failed to load funding data. Ensure you have generated the data file by
      running "npm run generate-funding-data at the project root. Error: ${error}`
    );
    throw error;
  }
};

const fundingData = await loadFundingData();

/**
 * Determines the funding history category for a given company based on its past funding amount.
 * @param businessId - The Business ID of the company.
 * @returns An object containing the funding history result and the applied rules.
 */
export const getFundingHistoryForCompany = (
  businessId: string,
  averageAnnualRevenue: number | null,
  config: NonNullable<ProjectAssesmentConfiguration>["fundingHistory"]
): { result: FundingHistory; rules: FundingRule[] } => {
  const fundingEntry = fundingData[businessId];

  if (!fundingEntry) {
    return {
      result: "none",
      rules: [{ code: "noFundingHistory", outcome: "n/a" }],
    };
  }

  const checks = [
    {
      check: hasRecentGrant(fundingEntry, config.recentGrant.minTimeAgo),
      weight: config.recentGrant.weight,
      perform: config.recentGrant.perform,
    },
    {
      check: hasMultipleFundingInstances(
        fundingEntry,
        config.multipleFundingInstances.minTimes
      ),
      weight: config.multipleFundingInstances.weight,
      perform: config.multipleFundingInstances.perform,
    },
    {
      check: hasMostlyGrants(fundingEntry, config.mostlyGrants.grantThreshold),
      weight: config.mostlyGrants.weight,
      perform: config.mostlyGrants.perform,
    },
    {
      check: hasOneFundingSignificantToRevenue(
        fundingEntry,
        config.oneFundingSignificantToRevenue.percentageOfRevenue,
        averageAnnualRevenue
      ),
      weight: config.oneFundingSignificantToRevenue.weight,
      perform: config.oneFundingSignificantToRevenue.perform,
    },
    {
      check: hasOneFundingSignificantToTotal(
        fundingEntry,
        config.oneFundingSignificantToTotal.percentageOfTotalFunding
      ),
      weight: config.oneFundingSignificantToTotal.weight,
      perform: config.oneFundingSignificantToTotal.perform,
    },
    {
      check: hasSteadyFundingGrowth(
        fundingEntry,
        config.steadyFundingGrowth.growthYearsThreshold
      ),
      weight: config.steadyFundingGrowth.weight,
      perform: config.steadyFundingGrowth.perform,
    },
  ].filter((ind) => ind.perform);

  const totalWeight = checks.reduce((sum, ind) => sum + ind.weight, 0);
  const achievedScore = checks
    .map(
      (ind) =>
        outcomeToWeight(ind.check.outcome as FundingRule["outcome"]) *
        ind.weight
    )
    .reduce((sum, val) => sum + val, 0);

  const percentage = achievedScore / totalWeight;

  const rules = checks.map((ind) => ind.check);

  if (percentage === 0) return { result: "none", rules };
  if (percentage <= 0.33) return { result: "low", rules };
  if (percentage <= 0.66) return { result: "medium", rules };
  return { result: "high", rules };
};

const outcomeToWeight = (outcome: FundingRule["outcome"]): number =>
  ({ "n/a": 0.5, unfavorable: 0, favorable: 1 }[outcome]);

// helper for mapping boolean -> outcome enum
const getOutcome = (positive: boolean) =>
  positive ? "favorable" : "unfavorable";

/**
 * Checks if funding includes a grant received within the specified number of years.
 * @param funding - Array of funding entries.
 * @param minTimeAgo - Number of years to look back for recent grants.
 * @returns A rule indicating whether a recent grant was found.
 */
const hasRecentGrant = (
  funding: FundingEntry[],
  minTimeAgo: number
): Extract<FundingRule, { code: "recentGrant" }> => {
  const mostRecentYear = funding.at(-1)!.year;
  const favorable = mostRecentYear >= new Date().getFullYear() - minTimeAgo;
  return {
    code: "recentGrant",
    params: { mostRecentYear },
    outcome: getOutcome(favorable),
  };
};

/**
 * Checks if the company has received funding multiple times.
 * @param funding - Array of funding entries.
 * @param minTimes - Minimum number of times funding should be received.
 * @returns A rule indicating whether the company has received funding multiple times.
 */
const hasMultipleFundingInstances = (
  funding: FundingEntry[],
  minTimes: number
): Extract<FundingRule, { code: "multipleFundingInstances" }> => {
  const favorable = funding.length >= minTimes;
  return {
    code: "multipleFundingInstances",
    params: { times: funding.length },
    outcome: getOutcome(favorable),
  };
};

const formatPercentage = (value: number, decimals = 1) =>
  `${value.toFixed(decimals)}%`;

/**
 * Checks if the majority of funding entries are grants (not loans).
 * @param funding - Array of funding entries.
 * @param grantThreshold - threshold ratio to consider majority as grants.
 * @returns A rule indicating whether the majority of funding entries are grants.
 */
const hasMostlyGrants = (
  funding: FundingEntry[],
  grantThreshold: number
): Extract<FundingRule, { code: "mostlyGrants" }> => {
  const grantCount = funding.filter((f) => !f.isLoan).length;
  const total = funding.length;
  const favorable = grantCount / total >= grantThreshold;
  return {
    code: "mostlyGrants",
    params: { percentage: formatPercentage((grantCount / total) * 100) },
    outcome: getOutcome(favorable),
  };
};

/**
 * Checks if any single funding entry is significant compared to average annual revenue.
 * @param funding - Array of funding entries.
 * @param percentageOfRevenue - percentage threshold of average annual revenue.
 * @param averageAnnualRevenue - average annual revenue of the company.
 * @returns A rule indicating whether significant funding was found or "n/a" rule if revenue is not provided.
 */
const hasOneFundingSignificantToRevenue = (
  funding: FundingEntry[],
  percentageOfRevenue: number,
  averageAnnualRevenue: number | null = null
): Extract<FundingRule, { code: "oneFundingSignificantToRevenue" }> => {
  if (!averageAnnualRevenue)
    return {
      code: "oneFundingSignificantToRevenue",
      outcome: "n/a",
    };

  const threshold = averageAnnualRevenue * percentageOfRevenue;

  const maxFundingEntry = funding.reduce((prev, curr) =>
    prev.amount > curr.amount ? prev : curr
  );
  const favorable = maxFundingEntry.amount >= threshold;
  return {
    code: "oneFundingSignificantToRevenue",
    params: {
      largestFundingAmount: maxFundingEntry.amount,
      averageAnnualRevenue,
      receivedYear: maxFundingEntry.year,
      isLoan: maxFundingEntry.isLoan,
    },
    outcome: getOutcome(favorable),
  };
};

/**
 * Checks if there is a single funding entry that constitutes a large portion of total funding.
 * @param funding - Array of funding entries.
 * @param ratio - minimum ratio of single funding to total funding.
 * @returns A rule indicating whether such funding exists or "n/a" if less than 2 funding entries exist.
 */
const hasOneFundingSignificantToTotal = (
  funding: FundingEntry[],
  ratio: number
): Extract<FundingRule, { code: "oneFundingSignificantToTotal" }> => {
  if (funding.length < 2)
    return { code: "oneFundingSignificantToTotal", outcome: "n/a" };
  const total = funding.reduce((sum, f) => sum + f.amount, 0);
  const largest = Math.max(...funding.map((f) => f.amount));
  const favorable = largest / total >= ratio;
  return {
    code: "oneFundingSignificantToTotal",
    outcome: getOutcome(favorable),
    params: { largestFundingAmount: largest, totalFundingAmount: total },
  };
};

/**
 * Checks if funding has grown steadily over the years with some leniency.
 * @param funding - Array of funding entries.
 * @param threshold - minimum ratio of years with funding increases.
 * @returns A rule indicating whether funding has grown steadily or "n/a" if less than 2 funding entries exist.
 */
const hasSteadyFundingGrowth = (
  funding: FundingEntry[],
  threshold: number
): Extract<FundingRule, { code: "steadyFundingGrowth" }> => {
  if (funding.length < 2)
    return {
      code: "steadyFundingGrowth",
      outcome: "n/a",
    };

  const increases = funding
    .slice(1)
    .filter((amt, i) => amt.amount > funding[i].amount).length;
  const ratio = increases / (funding.length - 1);
  const favorable = ratio >= threshold;

  return {
    code: "steadyFundingGrowth",
    params: { growthYearsPercent: formatPercentage(ratio * 100) },
    outcome: getOutcome(favorable),
  };
};
