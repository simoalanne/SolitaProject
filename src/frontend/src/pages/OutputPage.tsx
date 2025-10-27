// Moved from src/frontend/src/components/PlaceHolderOutput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/

import { type ProjectOutput, ProjectOutputSchema } from "@myorg/shared";

const PlaceHolderOutput = ({ output }: { output: ProjectOutput }) => {
  return (
    <div>
      <h2>Project Assessment</h2>
      <p>
        <strong>Innovation traffic light:</strong>{" "}
        {output.llmProjectAssessment.innovationTrafficLight}
      </p>
      <p>
        <strong>Strategic fit traffic light:</strong> {output.llmProjectAssessment.strategicFitTrafficLight}
      </p>
      <h3>Company Evaluation</h3>
      <ul>
        {output.companyEvaluations.map((evaluation) => (
          <li key={evaluation.businessId}>
            <strong>{evaluation.businessId}:</strong> Financial Risk - {evaluation.financialRisk},{" "}
            Funding History - {evaluation.businessFinlandFundingHistory}
          </li>
        ))}
      </ul>
      <h3>LLM Feedback</h3>
      <p>{output.llmProjectAssessment.feedback}</p>
      <h3>Is output data valid?</h3>
      <p>{ProjectOutputSchema.safeParse(output).success.toString()}</p>
    </div>
  );
};

export default PlaceHolderOutput;
