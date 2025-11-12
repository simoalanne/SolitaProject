
// Moved from src/frontend/src/components/PlaceHolderOutput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/
// import "../../css/base.css";
import "../../css/base.css";
import "../../css/outputPage.css"

import { type ProjectOutput } from "@myorg/shared";
import { useTranslation } from "../i18n/useTranslation";

const PlaceHolderOutput = ({ output }: { output: ProjectOutput }) => {
  const { t } = useTranslation();

  const trafficLight = (color?: string) => {
    if (!color) return undefined;
    const col = color?.toLowerCase().trim();
    if (col?.includes('green')) return 'green';
    if (col?.includes('yellow')) return 'yellow';
    if (col?.includes('red')) return 'red';
  };

  //color keys 
  const innovationKey = trafficLight(output.llmProjectAssessment?.innovationTrafficLight);
  const strategyKey = trafficLight(output.llmProjectAssessment?.strategicFitTrafficLight);

return(
  <div className="form-wrapper">
    <h2>{t("project_assessment_results")}</h2>
      <div className="form">
        <div className="trafficlights-container">
          <div className="trafficlight-items">
            <p style={{color: innovationKey}}>
              <strong>{t("innovation")}: </strong>{" "}<br/>
            {/* {output.llmProjectAssessment?.innovationTrafficLight} */}
            </p>
            <div className="trafficlights">
              <span className={`dot red ${innovationKey === "red" ? "active" : ""}`} />
              <span className={`dot yellow ${innovationKey === "yellow" ? "active" : ""}`} />
              <span className={`dot green ${innovationKey === "green" ? "active" : ""}`} />
            </div>
          </div>
          <div className="trafficlight-items">
            <p style={{color: strategyKey}}>
            <strong>{t("strategic_fit")}: </strong>{" "}<br />
              {/* {output.llmProjectAssessment?.strategicFitTrafficLight} */}
            </p>
           <div className="trafficlights">
              <span className={`dot red ${strategyKey === "red" ? "active" : ""}`} />
              <span className={`dot yellow ${strategyKey === "yellow" ? "active" : ""}`} />
              <span className={`dot green ${strategyKey === "green" ? "active" : ""}`} />
          </div>
        </div>
           </div>
        <div className="result-container">
           <div className="eval-container">
             <h3>{t("company_evaluation")}</h3>
             <ul>
               {output.companyEvaluations.map((evaluation) => (
                 <li key={evaluation.businessId}>
                   <strong>{evaluation.businessId}:</strong> {t("financial_risk")} {evaluation.financialRisk},{" "}
                   {t("funding_history")} {evaluation.businessFinlandFundingHistory}
                 </li>
               ))}
             </ul>
           </div>
           <div className="feedback-container">
             <h3>{t("llm_feedback")}</h3>
             <p>{output.llmProjectAssessment?.feedback}</p>
           </div>
         </div>
      </div>
  </div>
) 
}

export default PlaceHolderOutput;