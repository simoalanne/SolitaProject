import { type FundingHistory } from "@myorg/shared";
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
 * @returns The funding history represented as "none" | "low" | "medium" | "high".
 */
export const getFundingHistoryForCompany = (
  businessId: string
): FundingHistory => {
  const fundingEntry = fundingData[businessId];

  if (!fundingEntry) return "none";

  const indicators = [
    { check: hasRecentGrant(fundingEntry, 3), weight: 2 },
    { check: hasReceivedFundingMultipleTimes(fundingEntry, 2), weight: 2 },
    { check: hasMostlyGrants(fundingEntry, 0.5), weight: 1 },
    { check: hasSignificantFunding(fundingEntry, 50000), weight: 1 },
    { check: hasLargeSingleFunding(fundingEntry, 0.5), weight: 1 },
  ];

  const totalWeight = indicators.reduce((sum, ind) => sum + ind.weight, 0);
  const achievedWeight = indicators
    .filter((ind) => ind.check)
    .reduce((sum, ind) => sum + ind.weight, 0);

  const percentage = achievedWeight / totalWeight;

  if (percentage === 0) return "none";
  if (percentage <= 0.33) return "low";
  if (percentage <= 0.66) return "medium";
  return "high";
};

// Data is not exactly easy to analyze so the approach here is set of positive indicators about
// how the company has successfully received funding in the past without just trying to compare
// against arbitrary thresholds.

// 1. Received at least one grant in the last N years.
const hasRecentGrant = (funding: FundingEntry[], recentYears: number) =>
  funding.some(
    (f) => !f.isLoan && f.year >= new Date().getFullYear() - recentYears
  );

// 2. Has received funding more than once in the past.
const hasReceivedFundingMultipleTimes = (funding: FundingEntry[], minTimes: number) =>
  funding.length >= minTimes;

// 3. Majority of funding is grant-type.
const hasMostlyGrants = (funding: FundingEntry[], threshold: number) =>
  funding.filter((f) => !f.isLoan).length / funding.length >= threshold;

// 4. Any funding above a simple threshold.
const hasSignificantFunding = (funding: FundingEntry[], threshold: number) =>
  funding.some((f) => f.amount >= threshold);

// 5. A single funding entry constitutes a large portion of total funding.
const hasLargeSingleFunding = (funding: FundingEntry[], ratio: number) => {
  if (funding.length < 2) return false; // Need at least two entries to compare
  const total = funding.reduce((sum, f) => sum + f.amount, 0);
  const largest = Math.max(...funding.map((f) => f.amount));
  return largest / total >= ratio;
};

export default getFundingHistoryForCompany;
