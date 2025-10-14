import {
  type ProjectInput,
  type ProjectOutput,
  type CompanyRisks,
} from "../../../shared/schema.ts";
import generateFeedBack from "../ai/aiClient.ts";

const assessProject = async (
  projectInput: ProjectInput
): Promise<ProjectOutput> => {
  const llmFeedback = await generateFeedBack(projectInput);
  // TODO: Replace the placeholder logic with actual assessment logic (api calls, formulas, etc)
  const consortium = projectInput.consortium;
  const businessIds = [
    consortium.leadApplicantBusinessId,
    ...consortium.memberBusinessIds,
  ];
  const placeHolderOutput: ProjectOutput = {
    success: {
      successProbability: 1,
      trafficLight: "green",
    },
    companyRisks: businessIds.reduce((acc, id) => {
      acc[id] = {
        financialRisk: "low",
        businessFinlandFundingHistory: "none",
      };
      return acc;
    }, {} as CompanyRisks),
    llmFeedback: llmFeedback.feedback,
  };
  return placeHolderOutput;
};

export default assessProject;
