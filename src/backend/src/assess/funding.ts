import { type FundingHistory, type Rule } from "@myorg/shared";
import type { ProjectAssessmentConfig } from "../config/projectAssesmentConfig.ts";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  makeAssessment,
  makeRule,
  outcomeFromBool,
  type Assessment,
} from "./common.ts";

export type FundingEntry = { year: number; amount: number; isLoan: boolean };
export type FundingData = Record<string, FundingEntry[]>;
type FundingHistoryCodes = keyof ProjectAssessmentConfig["fundingHistory"];
type FundingRule = Rule & { code: FundingHistoryCodes };
type FundingAsssementment = Assessment<FundingHistory, FundingHistoryCodes>;

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
    console.error(`Failed to load funding data: ${error}`);
    throw error;
  }
};

const fundingData = await loadFundingData();

/**
 * Analyzes whether a company is overfunded based on its funding history.
 * @param businessId - The Business ID of the company.
 * @param config - The funding history configuration parameters.
 * @param thresholds - The funding history thresholds for assessment.
 * @returns An object containing the overall funding history assessment and the individual rule results.
 */
export const getFundingHistoryForCompany = (
  businessId: string,
  config: ProjectAssessmentConfig["fundingHistory"],
  thresholds: ProjectAssessmentConfig["thresholds"]["fundingHistory"],
  isStartupOrRDDriven: boolean
): FundingAsssementment => {
  const fundingEntry = fundingData[businessId];

  if (!fundingEntry) {
    return {
      result: "none",
      rawScore: 0,
      rules: [{ code: "noFundingHistory", outcome: "n/a" }],
    };
  }

  fundingEntry.sort((a, b) => a.year - b.year);

  const rules = [
    makeRule(
      hasTooRecentFunding,
      config.tooRecentFunding,
      fundingEntry,
      isStartupOrRDDriven
    ),
    makeRule(
      hasTooManyInstances,
      config.tooManyInstances,
      fundingEntry,
      isStartupOrRDDriven
    ),
  ];

  return makeAssessment(rules, thresholds) as FundingAsssementment;
};

/**
 * Checks if company has received funding too recently.
 * @param funding - The funding history entries of the company.
 * @param isStartupOrRDDriven - Whether the company is a startup or R&D driven.
 * @param minYearsAgo - Minimum number of years since last funding.
 * @param startupMinYearsAgo - Same as above but applied when the company is a startup or R&D driven.
 * @returns A Rule indicating whether the company has received funding too recently.
 */
const hasTooRecentFunding = (
  funding: FundingEntry[],
  isStartupOrRDDriven: boolean,
  minYearsAgo: number,
  startupMinYearsAgo: number
): FundingRule => {
  // The threshold should generally be configured to be lower for startups and R&D driven companies
  const thresholdToUse = isStartupOrRDDriven ? startupMinYearsAgo : minYearsAgo;
  const latest = funding.at(-1)!.year;
  const currentYear = new Date().getFullYear();
  const tooRecent = latest >= currentYear - thresholdToUse;
  return {
    code: "tooRecentFunding",
    values: { latestYear: { value: latest, type: "integer" } },
    outcome: outcomeFromBool(!tooRecent),
  };
};

/**
 * Checks if company has received funding more times than allowed.
 * @param funding - The funding history entries of the company.
 * @param maxAllowed - Maximum allowed funding instances.
 * @returns A Rule indicating whether the company has received too many funding instances.
 */
const hasTooManyInstances = (
  funding: FundingEntry[],
  isStartupOrRDDriven: boolean,
  maxAllowed: number
): FundingRule => {
  // Startups and R&D driven companies shouldn't be punished for multiple funding instances
  // cause how are they supposed to grow otherwise? However the funding should also then lead
  // to growth. Right now this check just assumes that if the company is repeatedly getting funding
  // it surely is also growing...
  if (isStartupOrRDDriven) {
    return {
      code: "tooManyInstances",
      outcome: "n/a",
    };
  }
  const count = funding.length;
  const withinLimit = count <= maxAllowed;

  return {
    code: "tooManyInstances",
    values: { count: { value: count, type: "integer" } },
    outcome: outcomeFromBool(withinLimit),
  };
};
