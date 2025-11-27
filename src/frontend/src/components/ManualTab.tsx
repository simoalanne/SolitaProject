import { useTranslation } from "../i18n/useTranslation";
import "../../css/financialDataInput.css";

interface Props {
  draft: { revenues: any[]; profits: any[] };
  setDraft: React.Dispatch<any>;
  isSynced: boolean;
  save: () => void;
  clear: () => void;
}

const ManualTab = ({ draft, setDraft, isSynced, save, clear }: Props) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="fdi-grid">
        <div>{t("revenues")}</div>
        {draft.revenues.map((v, i) => (
          <input
            key={i}
            value={v}
            type="number"
            className="fdi-input"
            onChange={(e) =>
              setDraft((d: any) => {
                const revenues = [...d.revenues];
                revenues[i] = Number(e.target.value);
                return { ...d, revenues };
              })
            }
          />
        ))}

        <div>{t("profits")}</div>
        {draft.profits.map((v, i) => (
          <input
            key={i}
            value={v}
            type="number"
            className="fdi-input"
            onChange={(e) =>
              setDraft((d: any) => {
                const profits = [...d.profits];
                profits[i] = Number(e.target.value);
                return { ...d, profits };
              })
            }
          />
        ))}
      </div>

      <button onClick={isSynced ? clear : save} className="fdi-save-btn">
        {isSynced ? t("clear_financial_data") : t("save_financial_data")}
      </button>
    </div>
  );
};

export default ManualTab;
