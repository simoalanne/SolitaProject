import {
  type BusinessId,
  type ProjectInput,
  type ProjectOutput,
  type TrafficLight,
  type Configuration,
} from "../../../shared/schema.ts";
import {
  generateFeedback,
  generateFeedbackForCompany,
} from "../ai/aiClient.ts";
import { type ProjectAssessmentConfig } from "../config/projectAssesmentConfig.ts";
import deepMerge from "../utils/deepMerge.ts";
import { getFundingHistoryForCompany } from "../assess/funding.ts";
import baseProjectAssessmentConfig from "../config/projectAssesmentConfig.ts";
import { getFinancialRiskForCompany } from "./financial.ts";
import {
  avg,
  enumToPercentage,
  percentageToEnum,
  roundToTwoDecimals,
  weightedPercentage,
} from "./common.ts";

const assessProject = async (
  projectInput: ProjectInput
): Promise<ProjectOutput> => {
  const config = deepMerge<ProjectAssessmentConfig>(
    baseProjectAssessmentConfig,
    projectInput.configuration
  );
  const startTime = Date.now();
  // Run company evaluation and feedback generation in parallel since they are independent from each other
  const [companyEvaluations, projectFeedback] = await Promise.all([
    Promise.all(
      projectInput.consortium.map(async (company) => {
        const id = company.businessId;
        const financialRisk = getFinancialRiskForCompany(
          company,
          config.financialRisk,
          config.thresholds.financialRisk
        );
        const fundingHistory = getFundingHistoryForCompany(
          id,
          config.fundingHistory,
          config.thresholds.fundingHistory,
          company.isStartupOrRDDriven
        );
        const roleFeedback = await generateFeedbackForCompany(
          projectInput.generalDescription,
          company.projectRoleDescription
        );

        const trafficLight = calculateCompanyTrafficLight(
          config.weights.company,
          config.thresholds.trafficLight,
          financialRisk.rawScore,
          fundingHistory.rawScore,
          roleFeedback?.relevancy,
          roleFeedback?.clarity
        );

        return {
          businessId: id,
          displayName: company.displayName,
          fundingHistory,
          financialRisk,
          llmRoleAssessment: roleFeedback,
          trafficLight: trafficLight.light,
          rawScore: trafficLight.rawScore,
        };
      })
    ),
    generateFeedback(projectInput.generalDescription),
  ]);

  const companyScores = companyEvaluations.map((c, idx) => ({
    businessId: c.businessId,
    score: c.rawScore,
    budget: projectInput.consortium[idx].budget,
  }));

  const companyWeights = calculateCompanyWeights(companyScores);

  const overallTrafficLight = calculateOverallTrafficLight(
    config.weights,
    config.thresholds.trafficLight,
    companyWeights,
    companyScores,
    projectFeedback?.innovationTrafficLight,
    projectFeedback?.strategicFitTrafficLight
  );
  // won't mutate the imported config because deepMerge calls structuredClone internally
  (config.weights as Configuration["weights"]).perCompany = companyWeights;
  const endTime = Date.now();
  return {
    companyEvaluations,
    overallTrafficLight: overallTrafficLight.light,
    rawOverallScore: overallTrafficLight.rawScore,
    llmProjectAssessment: projectFeedback,
    metadata: {
      assessmentTimeMs: endTime - startTime,
      generatedAt: new Date(endTime).toISOString(),
      usedConfiguration: config as unknown as Configuration,
    },
  };
};

type WeightedItem = {
  weight: number;
  value?: number | TrafficLight;
};

const calculateTrafficLight = (items: WeightedItem[], thresholds: ProjectAssessmentConfig["thresholds"]["trafficLight"]) => {
  const rawScore = weightedPercentage(
    items.map(({ weight, value }) => ({
      weight,
      value:
        typeof value === "string"
          ? enumToPercentage(value, thresholds)
          : value,
    }))
  );
  return {
    light: percentageToEnum(rawScore, thresholds),
    rawScore,
  };
};

const calculateCompanyTrafficLight = (
  weights: ProjectAssessmentConfig["weights"]["company"],
  trafficLightThresholds: ProjectAssessmentConfig["thresholds"]["trafficLight"],
  financialRisk: number,
  fundingHistory: number,
  relevancy?: TrafficLight,
  clarity?: TrafficLight
) =>
  calculateTrafficLight([
    { weight: weights.financialRisk, value: financialRisk },
    { weight: weights.fundingHistory, value: fundingHistory },
    { weight: weights.descriptionRelevancy, value: relevancy },
    { weight: weights.descriptionClarity, value: clarity },
  ], trafficLightThresholds);

const calculateOverallTrafficLight = (
  weights: ProjectAssessmentConfig["weights"],
  trafficLightThresholds: ProjectAssessmentConfig["thresholds"]["trafficLight"],
  companyWeights: CompanyWeights,
  companyScores: { businessId: string; score: number }[],
  innovationScore?: TrafficLight,
  strategicFitScore?: TrafficLight
) => {
  const rawCompanyScore = weightedPercentage(
    companyScores.map((c) => ({
      weight: companyWeights[c.businessId],
      value: c.score,
    }))
  );
  return calculateTrafficLight([
    { weight: weights.project.allCompanyEvaluations, value: rawCompanyScore },
    { weight: weights.project.innovation, value: innovationScore },
    { weight: weights.project.strategicFit, value: strategicFitScore },
  ], trafficLightThresholds);
};

type CompanyWeights = Record<BusinessId, number>;

const calculateCompanyWeights = (
  companyScores: { businessId: string; score: number; budget: number }[]
): CompanyWeights => {
  const totalBudget = companyScores.reduce((a, c) => a + c.budget, 0);
  return Object.fromEntries(
    companyScores.map((c) => [
      c.businessId,
      roundToTwoDecimals(c.budget / totalBudget),
    ])
  );
};

export default assessProject;
