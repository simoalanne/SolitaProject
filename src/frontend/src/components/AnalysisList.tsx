import { type AnalysisExplanations } from "../utils/fundingAndFinancialRiskExplanations";
import { useTranslation } from "../i18n/useTranslation";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { useContext } from "react";
import { ThemeContext } from "../ThemeContext";
import "../../css/analysisList.css";

type AnalysisListProps = {
  explanations: AnalysisExplanations;
};

const AnalysisList = ({ explanations }: AnalysisListProps) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  const BoldNumericPartsFromString = ({ text }: { text: string }) => {
    // Match numbers with optional dots between digits, optionally followed by optional space and € or %
    const parts = text.split(/(\d+(?:\.\d+)*(?: ?[€%])?)/g);
    return (
      <>
        {parts.map((part, index) =>
          /^\d+(?:\.\d+)*[€%]?$/.test(part) ? <strong key={index}>{part}</strong> : part
        )}
      </>
    );
  }

  const getOutcomeIcon = (outcome: string) => ({
    favorable: <CheckCircle className="analysis-icon favorable" />,
    unfavorable: <XCircle className="analysis-icon unfavorable" />,
    "n/a": <MinusCircle className="analysis-icon na" />,
  }[outcome]);

  // TODO: Render some kind of donut chart or similar below the list that lists all rules and their weights
  return (
    <ul className={`analysis-list ${theme}`}>
      {explanations.map((e) => (
        <li key={e.key} className={`analysis-item ${e.outcome === "n/a" ? "na" : e.outcome}`}>
          {getOutcomeIcon(e.outcome)}
          <span className="analysis-text"><BoldNumericPartsFromString text={t(e.key, e.params)} /></span>
        </li>
      ))}
    </ul>
  );
};

export default AnalysisList;
