import {
  type ProjectInput,
  type ProjectOutput,
} from "../../../shared/schema.ts";
import generateFeedback from "../ai/aiClient.ts";
import { getFundingHistoryForCompany } from "../assess/funding.ts";
import { getFinancialRiskForCompany } from "./financial.ts";

const assessProject = async (
  projectInput: ProjectInput
): Promise<ProjectOutput> => {
  // Run company evaluation and feedback generation in parallel since they are independent from each other
  const [companyEvaluations, feedback] = await Promise.all([
    Promise.all(
      projectInput.businessIds.map(async (id) => {
        const financialRisk = await getFinancialRiskForCompany(id);
        const fundingHistory = getFundingHistoryForCompany(id);
        return {
          businessId: id,
          businessFinlandFundingHistory: fundingHistory,
          financialRisk: financialRisk,
          trafficLight: "green" as const,
        };
      })
    ),
    generateFeedback(projectInput.project.description),
  ]);
  return {
    companyEvaluations,
    llmProjectAssessment: feedback,
  };
};

export default assessProject;
