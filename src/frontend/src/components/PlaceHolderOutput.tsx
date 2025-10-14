import { type ProjectOutput, ProjectOutputSchema } from "@myorg/shared";

const PlaceHolderOutput = ({ output }: { output: ProjectOutput }) => {
  return (
    <div>
      <h2>Project Assessment</h2>
      <p>
        <strong>Success Probability:</strong>{" "}
        {output.success.successProbability}
      </p>
      <p>
        <strong>Traffic Light:</strong> {output.success.trafficLight}
      </p>
      <h3>Company Risks</h3>
      <ul>
        {Object.entries(output.companyRisks).map(([id, risk]) => (
          <li key={id}>
            <strong>{id}:</strong> Financial Risk - {risk.financialRisk},{" "}
            Funding History - {risk.businessFinlandFundingHistory}
          </li>
        ))}
      </ul>
      <h3>LLM Feedback</h3>
      <p>{output.llmFeedback}</p>
      <h3>Is ouptput data valid?</h3>
      <p>{ProjectOutputSchema.safeParse(output).success.toString()}</p>
    </div>
  );
};

export default PlaceHolderOutput;
