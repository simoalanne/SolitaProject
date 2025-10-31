import { type BusinessId, type FundingHistory } from "@myorg/shared";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

type FundingData = Record<BusinessId, number>;

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

// The file contains around ~22k entries, so just keeping it in memory is fine
const fundingData = await loadFundingData();

/**
 * Determines the funding history category for a given company based on its past funding amount.
 * @param businessId - The Business ID of the company.
 * @returns The funding history represented as "none" | "low" | "medium" | "high".
 */
export const getFundingHistoryForCompany = (
  businessId: BusinessId
): FundingHistory => {
  const pastFunding = fundingData[businessId] || 0;

  // Placeholder code
  const thresholds = [
    { value: 0, label: "none" },
    { value: 100000, label: "low" },
    { value: 1000000, label: "medium" },
    { value: Infinity, label: "high" },
  ];

  return thresholds.find((t) => pastFunding <= t.value)!.label as FundingHistory;
};

export default getFundingHistoryForCompany;
