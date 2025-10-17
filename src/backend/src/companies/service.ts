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

export const getCompanyNameFromBusinessId = async (
  businessId: string
): Promise<string | null> => {
  const data = await fetch(`${baseUrl}?businessId=${businessId}`);
  const transformed = transformApiResponse(await data.json());
  return transformed[0]?.name || null;
};


// TODO: the ytj API does not sort the results in useful way. this includes both
// the companies entries and inside the names array. especially the names array
// is weird since the closest match to the search term is not the first entry
// which then leads to suggestions that don't at all match the search term.
export const autoCompleteCompanyName = async (
  partialName: string,
  limit: number
) => {
  // there is no limit param in the API so the results are sliced manually
  const data = await fetch(
    `${baseUrl}?name=${encodeURIComponent(partialName)}`
  );
  const transformed = transformApiResponse(await data.json());
  return transformed.slice(0, limit);
};

const transformApiResponse = (json: YtjApiResponse): MatchedCompanies => {
  if (json.totalResults === 0) return [];
  return json.companies.map((company) => ({
    businessId: company.businessId.value,
    name: company.names[0].name,
  }));
};
