import { type FundingHistory, type Rule } from "@myorg/shared";
import type { ProjectAssessmentConfig } from "../config/projectAssesmentConfig.ts";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  makeAssessment,
  makeRule,
  outcomeFromBool,
  roundToTwoDecimals,
  type Assessment,
} from "./common.ts";

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
  // Not used currently but maybe in the future
  isStartupOrRDDriven: boolean,
  config: ProjectAssessmentConfig["fundingHistory"],
  fundingHistoryThresholds: ProjectAssessmentConfig["thresholds"]["fundingHistory"]
): Assessment<FundingHistory> => {
  const fundingEntry = fundingData[businessId];

  if (!fundingEntry) {
    return {
      result: "none",
      rawScore: 0,
      rules: [{ code: "noFundingHistory", outcome: "n/a" }],
    };
  }

  const rules = [
    makeRule(hasRecentGrant, config.recentGrant, fundingEntry),
    makeRule(
      hasMultipleFundingInstances,
      config.multipleFundingInstances,
      fundingEntry
    ),
    makeRule(
      hasOneFundingSignificantToRevenue,
      config.oneFundingSignificantToRevenue,
      fundingEntry,
      averageAnnualRevenue
    ),
    makeRule(
      hasOneFundingSignificantToTotal,
      config.oneFundingSignificantToTotal,
      fundingEntry
    ),
    makeRule(hasSteadyFundingGrowth, config.steadyFundingGrowth, fundingEntry),
  ];

  return makeAssessment(rules, fundingHistoryThresholds);
};

/**
 * Checks if funding includes a grant received within the specified number of years.
 * @param funding - Array of funding entries.
 * @param minTimeAgo - Number of years to look back for recent grants.
 * @returns A rule indicating whether a recent grant was found.
 */
const hasRecentGrant = (funding: FundingEntry[], minTimeAgo: number): Rule => {
  const mostRecentYear = funding.at(-1)!.year;
  const favorable = mostRecentYear <= new Date().getFullYear() - minTimeAgo;
  return {
    code: "recentGrant",
    values: { mostRecentYear: { value: mostRecentYear, type: "integer" } },
    outcome: outcomeFromBool(favorable),
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
): Rule => {
  const favorable = funding.length <= minTimes;
  return {
    code: "multipleFundingInstances",
    values: { times: { value: funding.length, type: "integer" } },
    outcome: outcomeFromBool(favorable),
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
  averageAnnualRevenue: number | null = null,
  percentageOfRevenue: number
): Rule => {
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
    values: {
      percentage: {
        value: roundToTwoDecimals(
          maxFundingEntry.amount / averageAnnualRevenue
        ),
        type: "decimal",
      },
    },
    outcome: outcomeFromBool(favorable),
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
): Rule => {
  if (funding.length < 2)
    return { code: "oneFundingSignificantToTotal", outcome: "n/a" };
  const total = funding.reduce((sum, f) => sum + f.amount, 0);
  const largest = Math.max(...funding.map((f) => f.amount));
  const favorable = largest / total >= ratio;
  return {
    code: "oneFundingSignificantToTotal",
    outcome: outcomeFromBool(favorable),
    values: {
      percentage: {
        value: roundToTwoDecimals(largest / total),
        type: "decimal",
      },
    },
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
): Rule => {
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
    values: {
      growthYearsPercent: { value: roundToTwoDecimals(ratio), type: "decimal" },
    },
    outcome: outcomeFromBool(favorable),
  };
};
