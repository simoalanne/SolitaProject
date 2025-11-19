
// Moved from src/frontend/src/components/PlaceHolderOutput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/
// import "../../css/base.css";
import "../../css/base.css";
import "../../css/outputPage.css"

import { type ProjectOutput } from "@myorg/shared";
import { useContext } from "react";
import { LanguageContext } from "../LanguageContext";
import { useTranslation } from "../i18n/useTranslation";
import { getExplanations } from "../utils/fundingAndFinancialRiskExplanations";
import Collapsible from "../components/Collapsible";
import AnalysisList from "../components/AnalysisList";

type Outcome = "green" | "yellow" | "red" | undefined;

const PlaceHolderOutput = ({ output }: { output: ProjectOutput }) => {
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation();

  const TrafficLight = ({ label, outcome }: { label: string; outcome: Outcome }) => (
    <div className="trafficlight-items">
      <p><strong>{label}</strong></p>
      <div className="trafficlights">
        {["red", "yellow", "green"].map((color) => (
          <span
            key={color} className={`dot ${color} ${outcome === color ? "active" : ""}`} />
        ))}
      </div>
    </div>
  );


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

  return (
    <div className="form-wrapper">
      <h2>{t("project_assessment_results")}</h2>
      <div className="form output-form">
        <div className="trafficlights-container">
          <div className="trafficlight-items">
            <TrafficLight outcome={innovationKey} label={t("innovation") + ":"} />
          </div>
          <div className="trafficlight-items">
            <TrafficLight outcome={strategyKey} label={t("strategic_fit") + ":"} />
          </div>
        </div>
        <div className="result-container">
          <div className="eval-container">
            <h3>{t("company_evaluations")}</h3>
            <div className="company-evaluations">
              {output.companyEvaluations.map((evaluation) => (
                <div key={evaluation.businessId} className="company-eval-item">
                  <Collapsible
                    label={evaluation.displayName ? `${evaluation.displayName} (${evaluation.businessId})` : evaluation.businessId}
                    defaultOpen={true}
                  >
                    <Collapsible label={`${t("financialRisk")} - ${t(evaluation.financialRisk.result)}`}>
                      <AnalysisList explanations={getExplanations(
                        evaluation.financialRisk.rules,
                        output.metadata.usedConfiguration.financialRisk,
                        "fre"
                      )} />
                    </Collapsible>
                    <Collapsible label={`${t("fundingHistory")} - ${t(evaluation.fundingHistory.result)}`}>
                      <AnalysisList explanations={getExplanations(
                        evaluation.fundingHistory.rules,
                        output.metadata.usedConfiguration.fundingHistory,
                        "fhe"
                      )} />
                    </Collapsible>
                    <Collapsible label={t("llm_role_feedback")}>
                        <p className="llm-role-feedback">{evaluation.llmRoleAssessment?.feedback[language] || t("no_feedback_available")}</p>     
                    </Collapsible>
                  </Collapsible>
                </div>
              ))}
            </div>
          </div>
          <div className="feedback-container">
            <h3>{t("llm_feedback")}</h3>
            <p>{output.llmProjectAssessment?.feedback[language] || t("no_feedback_available")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaceHolderOutput;