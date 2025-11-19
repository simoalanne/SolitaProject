import {
  type ProjectInput,
  type ProjectOutput,
  type FinancialRisk,
  type FundingHistory,
  type TrafficLight,
} from "../../../shared/schema.ts";
import {
  generateFeedback,
  generateFeedbackForCompany,
} from "../ai/aiClient.ts";
import { getFundingHistoryForCompany } from "../assess/funding.ts";
import baseProjectAssessmentConfig, {
  createOutputConfig,
} from "../config/projectAssesmentConfig.ts";
import { getFinancialRiskForCompany } from "./financial.ts";

const assessProject = async (
  projectInput: ProjectInput
): Promise<ProjectOutput> => {
  // If config is missing, use defaults
  const config = projectInput.configuration || baseProjectAssessmentConfig;
  // Run company evaluation and feedback generation in parallel since they are independent from each other
  const [companyEvaluations, feedback] = await Promise.all([
    Promise.all(
      projectInput.consortium.map(async (company) => {
        const id = company.businessId;
        const avgRevenue = company.financialData
          ? company.financialData.revenues.reduce((sum, r) => sum + r, 0) /
            company.financialData.revenues.length
          : null;
        const financialRisk = getFinancialRiskForCompany(
          company,
          config.financialRisk
        );
        const fundingHistory = getFundingHistoryForCompany(
          id,
          avgRevenue,
          config.fundingHistory
        );
        const roleFeedback = await getFeedbackForRole(
          projectInput.generalDescription,
          company.projectRoleDescription
        );

        const trafficLight = computeTrafficLight(
          { value: financialRisk.result, weight: 0.6 },
          { value: fundingHistory.result, weight: 0.2 },
          // assume neutral if llm feedback is missing
          { value: roleFeedback?.relevancy || "yellow", weight: 0.1 },
          { value: roleFeedback?.clarity || "yellow", weight: 0.1 }
        );

        return {
          businessId: id,
          displayName: company.displayName,
          fundingHistory,
          financialRisk,
          llmRoleAssessment: roleFeedback,
          trafficLight: trafficLight,
        };
      })
    ),
    generateFeedback(projectInput.generalDescription),
  ]);

  const overallTrafficLight = computeOverallTrafficLight(
    companyEvaluations,
    projectInput.consortium.map((c) => c.budget),
    projectInput.consortium.reduce((sum, c) => sum + c.budget, 0)
  );

  const usedConfiguration = createOutputConfig(
    projectInput.consortium.map((c) => ({ id: c.businessId, budget: c.budget }))
  );

  return {
    companyEvaluations,
    overallTrafficLight,
    llmProjectAssessment: feedback,
    metadata: {
      usedConfiguration,
    },
  };
};

// TODO: weighted scoring used in multiple places. this logic should be centralized somewhere
const calculateWeightedScore = <
  T extends FinancialRisk | FundingHistory | TrafficLight
>(
  scoreMap: Record<T, number>,
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

// gets feedback for a company's role in the project from llm or null if no role description is provided
const getFeedbackForRole = async (
  overallDescription: string,
  roleDescription: string | undefined
) =>
  roleDescription
    ? await generateFeedbackForCompany(overallDescription, roleDescription)
    : undefined;

const computeOverallTrafficLight = (
  companyEvaluations: ProjectOutput["companyEvaluations"],
  budgets: number[],
  totalBudget: number,
  projectFeedback?: ProjectOutput["llmProjectAssessment"]
): TrafficLight => {
  // Calculate overall traffic light by weighting company traffic lights + llm project assessment
  // Individual company traffic light should be weighted per their budget share
  const trafficLightScores = companyEvaluations.map((evaluation, index) => {
    const trafficLightScore = calculateWeightedScore(
      { green: 1, yellow: 0.5, red: 0 },
      { value: evaluation.trafficLight, weight: budgets[index] / totalBudget }
    );
    return trafficLightScore;
  });

  const overallTrafficLightScore =
    trafficLightScores.reduce((sum, score) => sum + score, 0) * 8; // 0-8

  const strategicFitScore = projectFeedback
    ? calculateWeightedScore(
        { green: 1, yellow: 0.5, red: 0 },
        { value: projectFeedback.strategicFitTrafficLight, weight: 1 }
      )
    : 0.5;

  const innovationScore = projectFeedback
    ? calculateWeightedScore(
        { green: 1, yellow: 0.5, red: 0 },
        { value: projectFeedback.innovationTrafficLight, weight: 1 }
      )
    : 0.5;

  console.log({
    overallTrafficLightScore,
    strategicFitScore,
    innovationScore,
  });

  const combinedPercentage =
    (overallTrafficLightScore + strategicFitScore + innovationScore) / 10;

  console.log({ combinedPercentage });

  const overallTrafficLight =
    overallTrafficLightScore >= 0.75
      ? "green"
      : overallTrafficLightScore >= 0.4
      ? "yellow"
      : "red";

  return overallTrafficLight;
};

export default assessProject;
