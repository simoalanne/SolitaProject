
// Moved from src/frontend/src/components/PlaceHolderOutput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/
import "../../css/outputPage.css";
import { type ProjectOutput } from "@myorg/shared";

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
      <h2>Project Assessment Results</h2>
      <div className="scroll-container">
        <div className="trafficlights-container bg-color">
          <div className="result-container">
            <p>
              <strong>Innovation:</strong>{" "}
              {output.llmProjectAssessment?.innovationTrafficLight}
            </p>
            <div className="trafficlight">
              <span className={`dot red ${innovationKey === "red" ? "active" : ""}`} />
              <span className={`dot yellow ${innovationKey === "yellow" ? "active" : ""}`} />
              <span className={`dot green ${innovationKey === "green" ? "active" : ""}`} />
            </div>
          </div>

          <div className="result-container">
            <p>
              <strong>Strategic fit:</strong>{" "}
              {output.llmProjectAssessment?.strategicFitTrafficLight}
            </p>

            <div className="trafficlight">
              <span className={`dot red ${strategyKey === "red" ? "active" : ""}`} />
              <span className={`dot yellow ${strategyKey === "yellow" ? "active" : ""}`} />
              <span className={`dot green ${strategyKey === "green" ? "active" : ""}`} />
            </div>
          </div>
        </div>

        <div className="result-container">
          <div className="bg-color eval-container">
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
          <div className="bg-color feedback-container">
            <h3>LLM Feedback</h3>
            <p>{output.llmProjectAssessment?.feedback}</p>
          </div>
        </div>
      </div>
  </div>
  );
};

export default PlaceHolderOutput;