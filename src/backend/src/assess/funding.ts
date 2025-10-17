import { type BusinessId } from "@myorg/shared";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

type FundingData = Record<BusinessId, number>;

// The file contains around ~22k entries, so just keeping it in memory is fine
let cachedData: FundingData | null = null;


const getFundingData = async (): Promise<FundingData> => {
  cachedData ??= JSON.parse(
    await fs.readFile(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../assets/businessFinlandFundingData.json"
      ),
      "utf-8"
    )
  ) as FundingData;
  return cachedData;
};

/**
 * Returns the total funding amount Business Finland has granted to the given
 * business IDs in the past.
 * @param businessIds Array of business IDs
 * @returns Total funding amount in euros
 */
export const getTotalFundingForConsortium = async (businessIds: BusinessId[]): Promise<number> => {
  const fundingData = await getFundingData();
  return businessIds.reduce((acc, id) => acc + (fundingData[id] || 0), 0);
};

export default getFundingData;