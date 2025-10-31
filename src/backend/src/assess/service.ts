import {
  type ProjectInput,
  type ProjectOutput,
  type Company,
  type FinancialRisk,
  type FundingHistory,
  type TrafficLight,
} from "../../../shared/schema.ts";
import {
  generateFeedback,
  generateFeedbackForCompany,
} from "../ai/aiClient.ts";
import { getFundingHistoryForCompany } from "../assess/funding.ts";
import { getFinancialRiskForCompany } from "./financial.ts";

const assessProject = async (
  projectInput: ProjectInput
): Promise<ProjectOutput> => {
  // Run company evaluation and feedback generation in parallel since they are independent from each other
  const [companyEvaluations, feedback] = await Promise.all([
    Promise.all(
      projectInput.consortium.map(async (company) => {
        const id = company.businessId;

        const financialRisk = getFinancialRisk(company);
        const fundingHistory = getFundingHistoryForCompany(id);
        const roleFeedback = await getFeedbackForRole(
          projectInput.generalDescription,
          company.projectRoleDescription
        );

        const trafficLight = computeTrafficLight(
          { value: financialRisk, weight: 0.6 },
          { value: fundingHistory, weight: 0.2 },
          // assume neutral if llm feedback is missing
          { value: roleFeedback.relevancy || "yellow", weight: 0.1 },
          { value: roleFeedback.clarity || "yellow", weight: 0.1 }
        );

        return {
          businessId: id,
          businessFinlandFundingHistory: fundingHistory,
          financialRisk: financialRisk,
          llmRoleAssessment: roleFeedback,
          trafficLight: trafficLight,
        };
      })
    ),
    generateFeedback(projectInput.generalDescription),
  ]);
  return {
    companyEvaluations,
    overallTrafficLight: "green",
    llmProjectAssessment: feedback,
  };
};

const calculateWeightedScore = <
  T extends FinancialRisk | FundingHistory | TrafficLight
>(
  scoreMap: Record<string, number>,
  input: WeightedInput<T>
): number => {
  const valueScore = scoreMap[input.value];
  return valueScore * input.weight;
};

type WeightedInput<T extends FinancialRisk | FundingHistory | TrafficLight> = {
  value: T;
  weight: number;
};

const computeTrafficLight = (
  financialRisk: WeightedInput<FinancialRisk>,
  fundingHistory: WeightedInput<FundingHistory>,
  relevancy: WeightedInput<TrafficLight>,
  clarity: WeightedInput<TrafficLight>
): TrafficLight => {
  const financialRiskScore = calculateWeightedScore(
    // Assume if no financial data was available risk is low
    { low: 1, medium: 0.66, high: 0.33, "n/a": 1 },
    financialRisk
  );
  const fundingHistoryScore = calculateWeightedScore(
    { high: 1, medium: 0.66, low: 0.33, none: 0 },
    fundingHistory
  );
  const relevancyScore = calculateWeightedScore(
    { green: 1, yellow: 0.5, red: 0 },
    relevancy
  );
  const clarityScore = calculateWeightedScore(
    { green: 1, yellow: 0.5, red: 0 },
    clarity
  );
  // Should be between 0 and 1
  const totalScore =
    financialRiskScore + fundingHistoryScore + relevancyScore + clarityScore;
  const trafficLight =
    totalScore >= 0.75 ? "green" : totalScore >= 0.4 ? "yellow" : "red";
  return trafficLight;
};

// gets financial risk level for a company, or "n/a" if financial data is missing
const getFinancialRisk = (company: Company) =>
  company.financialData ? getFinancialRiskForCompany(company) : "n/a";

// gets feedback for a company's role in the project from llm or null if no role description is provided
const getFeedbackForRole = async (
  overallDescription: string,
  roleDescription: string
) =>
  roleDescription
    ? await generateFeedbackForCompany(overallDescription, roleDescription)
    : null;

export default assessProject;
