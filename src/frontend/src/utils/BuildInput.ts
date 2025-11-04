import type { Company, Consortium } from "@myorg/shared";

// helper to parse CSV of numbers -> number[]
export const parseNumberCSV = (s?: string | number[] | undefined): number[] =>
  s
    ? Array.isArray(s)
      ? (s as Array<string | number>)
          .map((n) => Number(n))
          .filter((n) => !Number.isNaN(n))
      : (s as string)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
          .map((n) => Number(n))
          .filter((n) => !Number.isNaN(n))
    : [];


/**
 * 
 */
export function buildConsortium(members: Company[], applicant: Company): Consortium {
  const consortium: Consortium = [];
  
  // Initialize consortium with the lead applicant data
  consortium.push({
    businessId: applicant.businessId || "",
    budget: Number(applicant.budget) || 0,
    requestedFunding: Number(applicant.requestedFunding) || 0,
    projectRoleDescription: applicant.projectRoleDescription || "Lead Applicant",
    financialData: {
      revenues: parseNumberCSV(applicant.financialData?.revenues),
      profits: parseNumberCSV(applicant.financialData?.profits),
    },
  });

  // Add each member to the consortium array
  for (const m of members) {
    consortium.push({
      businessId: m.businessId || "",
      budget: Number(m.budget) || 0,
      requestedFunding: Number(m.requestedFunding) || 0,
      projectRoleDescription: m.projectRoleDescription || "Consortium Member",
      financialData: {
        revenues: parseNumberCSV(m.financialData?.revenues),
        profits: parseNumberCSV(m.financialData?.profits),
      },
    });
  }

  return consortium;
}
    

export function buildConsortium2(members: Company[], applicant: Company): Consortium {
  const consortium: Consortium = [];

  function buildConsortiumEntry(entity: Company, defaultRole: string) {
    const revenues = parseNumberCSV(entity.financialData?.revenues);
    const profits = parseNumberCSV(entity.financialData?.profits);

    const hasFinancialData =
      (revenues && revenues.length > 0) ||
      (profits && profits.length > 0);

    const entry: Consortium[number] = {
      businessId: entity.businessId || "",
      budget: Number(entity.budget) || 0,
      requestedFunding: Number(entity.requestedFunding) || 0,
      projectRoleDescription: entity.projectRoleDescription || defaultRole,
    };

    if (hasFinancialData) {
      entry.financialData = { revenues, profits };
    }

    return entry;
  }

  // Add the lead applicant
  consortium.push(buildConsortiumEntry(applicant, "Lead Applicant"));

  // Add each consortium member
  for (const m of members) {
    consortium.push(buildConsortiumEntry(m, "Consortium Member"));
  }

  return consortium;
}