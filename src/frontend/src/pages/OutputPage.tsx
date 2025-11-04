
// Moved from src/frontend/src/components/PlaceHolderOutput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/
import "../../css/outputPage.css";
import { type ProjectOutput, ProjectOutputSchema } from "@myorg/shared";

const PlaceHolderOutput = ({ output }: { output: ProjectOutput }) => {

  const trafficLight = (color?: string) => {
    if (!color) return 'white';
    const col = color?.toLowerCase().trim();
    if (col?.includes('green')) return 'green';
    if (col?.includes('yellow')) return 'yellow';
    if (col?.includes('red')) return 'red';
    return 'white';
  };

  //color keys 
  const innovationKey = trafficLight(output.llmProjectAssessment?.innovationTrafficLight);
  const strategyKey = trafficLight(output.llmProjectAssessment?.strategicFitTrafficLight);


  return (
  <div className="output-form">
      <h2>Project Assessment</h2>
      <div className="innovation result-box">
        <p>
          <strong>Innovation traffic light:</strong>{" "}
          {output.llmProjectAssessment?.innovationTrafficLight}
        </p>
        <div className="trafficlight">
          <span className={`dot red ${innovationKey === "red" ? "active" : ""}`} />
          <span className={`dot yellow ${innovationKey === "yellow" ?  "active" : ""}`} />
          <span className={`dot green ${innovationKey === "green" ? "active" : ""}`} />
        </div>
      </div>
      <div className="strategy result-box">
        <p>
          <strong>Strategic fit traffic light:</strong>{" "}
          {output.llmProjectAssessment?.strategicFitTrafficLight}
        </p>
        <div className="trafficlight">
          <span className={`dot red ${strategyKey === "red" ? "active" : "" }`} />
          <span className={`dot yellow ${strategyKey === "yellow" ? "active" : ""}`} />
          <span className={`dot green ${strategyKey === "green" ? "active" : ""}`} />
        </div>
      </div>
      <div className="evaluation result-box">
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
      <div className="feedback result-box">
        <h3>LLM Feedback</h3>
        <p>{output.llmProjectAssessment?.feedback}</p>
      </div>
      <h3>Is output data valid?</h3>
      <p>{ProjectOutputSchema.safeParse(output).success.toString()}</p>
    </div>
  );
};

export default PlaceHolderOutput;