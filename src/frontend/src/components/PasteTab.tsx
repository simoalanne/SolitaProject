import { useTranslation } from "../i18n/useTranslation";
import "../../css/financialDataInput.css";

interface Props {
  businessId?: string;
  tryPaste: (txt: string) => void;
}

const PasteTab = ({ businessId, tryPaste }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="fdi-paste-container">
      {businessId && (
        <a
          href={`https://www.kauppalehti.fi/yritykset/yritys/${businessId.replace(
            /-/g,
            ""
          )}#taloustiedot`}
          target="_blank"
          rel="noreferrer"
          className="fdi-link"
        >
          {t("open_kauppalehti")}
        </a>
      )}

      <textarea
        value={""} 
        className="fdi-textarea"
        onChange={(e) => tryPaste(e.target.value)}
        placeholder={t("paste_financial_data")}
      />
    </div>
  );
};

export default PasteTab;
