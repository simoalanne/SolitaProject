import { distance } from "fastest-levenshtein";

type Company = {
  businessId: { value: string };
  names: { name: string }[];
};

type YtjApiResponse = {
  totalResults: number;
  companies: Company[];
};

type MatchedCompanies = { businessId: string; name: string }[];

const baseUrl = "https://avoindata.prh.fi/opendata-ytj-api/v3/companies";

/**
 *Fetches the company name for a given business ID.
 * @param businessId - The business ID of the company
 * @returns List with single matched company or empty list if not found
 */
export const getCompanyNameFromBusinessId = async (
  businessId: string
): Promise<MatchedCompanies> => {
  const data = await fetch(`${baseUrl}?businessId=${businessId}`);
  const transformed = transformApiResponse(await data.json(), "");
  const name = transformed[0].name;
  return name ? [{ businessId, name }] : [];
};

/**
 * Autocompletes company names based on a partial name.
 * @param partialName - The beginning of the company name to autocomplete
 * @param limit - Maximum number of results to return
 * @returns List of matched companies
 */
export const autoCompleteCompanyName = async (
  partialName: string,
  limit: number
) => {
  // there is no limit param in the API so the results are sliced manually
  const data = await fetch(
    `${baseUrl}?name=${encodeURIComponent(partialName)}`
  );
  const transformed = transformApiResponse(await data.json(), partialName);
  return transformed.slice(0, limit);
};

/**
 * Transforms the YTJ API response into a list of matched companies sorted by
 * name similarity to the target name.
 * @param json - YTJ API response
 * @param targetName - The name to compare against for sorting
 * @returns List of matched companies or
 */
const transformApiResponse = (
  json: YtjApiResponse,
  targetName: string
): MatchedCompanies => {
  if (json.totalResults === 0) return [];
  return json.companies
    .map((company) => {
      return {
        businessId: company.businessId.value,
        name: company.names[0].name,
      };
    })
    .sort((a, b) => {
      const normalizedA = a.name.toLowerCase().trim();
      const normalizedB = b.name.toLowerCase().trim();
      const normalizedTarget = targetName.toLowerCase().trim();
      
      // 1. Prioritize exact matches or those that start with the target name
      const aStarts = normalizedA.startsWith(normalizedTarget);
      const bStarts = normalizedB.startsWith(normalizedTarget);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // 2. Then sort by Levenshtein distance to the target name
      const distA = distance(normalizedA, normalizedTarget);
      const distB = distance(normalizedB, normalizedTarget);
      if (distA !== distB) {
        return distA - distB;
      }
      
      // 3. Finally, sort by name length (shorter names first)
      return normalizedA.length - normalizedB.length;
    });
};
