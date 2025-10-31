// Moved from src/frontend/src/components/PlaceHolderOutput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/

import { type ProjectOutput, ProjectOutputSchema } from "@myorg/shared";

const PlaceHolderOutput = ({ output }: { output: ProjectOutput }) => {
  return (
    <div className="output-form">
      <h2>Project Assessment</h2>
      <div className="innovation">
        <p>
          <strong>Innovation traffic light:</strong>{" "}
          {output.llmProjectAssessment?.innovationTrafficLight}
        </p>
      </div>
      <div className="strategy">
        <p>
          <strong>Strategic fit traffic light:</strong> {output.llmProjectAssessment?.strategicFitTrafficLight}
        </p>
      </div>
      <div className="evaluation">
        <h3>Company Evaluation</h3>
        <ul>
          {output.companyEvaluations.map((evaluation) => (
            <li key={evaluation.businessId}>
              <strong>{evaluation.businessId}:</strong> Financial Risk - {evaluation.financialRisk},{" "}
              Funding History - {evaluation.businessFinlandFundingHistory}
            </li>
          ))}
        </ul>
      </div>
      <div className="feedback">
        <h3>LLM Feedback</h3>
        <p>{output.llmProjectAssessment?.feedback}</p>
      </div>
      <h3>Is output data valid?</h3>
      <p>{ProjectOutputSchema.safeParse(output).success.toString()}</p>
    </div>
  );
};

export default PlaceHolderOutput;
