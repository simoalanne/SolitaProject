import { useState } from "react";
import { useTranslation } from "../i18n/useTranslation";
import {
  validateInput,
  FinancialDataSchema,
  type FinancialData,
} from "@myorg/shared";
import parseKauppalehtiData from "../utils/kauppalehtiParser";
import ToastMessage from "./ToastMessage";
import ManualTab from "./ManualTab";
import PasteTab from "./PasteTab";
import "../../css/financialDataInput.css";

interface Props {
  onSyncToForm: (data?: FinancialData) => void;
  isSynced: boolean;
  businessId?: string;
}

const empty = { revenues: Array(5).fill(""), profits: Array(5).fill("") };

const FinancialDataInput = ({ onSyncToForm, isSynced, businessId }: Props) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"manual" | "paste">("manual");
  const [draft, setDraft] = useState<FinancialData>(empty);
  const [toastMessage, setToastMessage] = useState<
    { message: string; uuid: string } | undefined
  >();

  const valid = validateInput(draft, FinancialDataSchema).errors === null;

  const save = (data?: FinancialData) => {
    console.log("received data to save:", data);
    const result = validateInput(data ?? draft, FinancialDataSchema);
    if (result.errors) return;
    onSyncToForm(result.input); 
  };

  const clear = () => {
    setDraft(empty);
    onSyncToForm(undefined);
  };

  const tryPaste = (txt: string) => {
    const parsed = parseKauppalehtiData(txt);
    const result = validateInput(parsed, FinancialDataSchema);

    if (result.errors) {
      setToastMessage({
        message: t("parsing_failed_financial_data"),
        uuid: crypto.randomUUID(),
      });
      return;
    }

    setDraft(result.input);
    save(result.input);
    setTab("manual");
  };

  return (
    <div className="fdi-container">
      <div className="fdi-tabs">
        <button
          className={tab === "manual" ? "fdi-tab-btn active" : "fdi-tab-btn"}
          onClick={() => setTab("manual")}
        >
          {t("add_data_manually")}
        </button>
        <button
          className={tab === "paste" ? "fdi-tab-btn active" : "fdi-tab-btn"}
          onClick={() => setTab("paste")}
        >
          {t("paste_from_kauppalehti")}
        </button>

        {valid && isSynced && (
          <span className="fdi-valid-synced">{t("financial_data_synced")}</span>
        )}
      </div>

      {tab === "manual" && (
        <ManualTab
          draft={draft}
          setDraft={setDraft}
          isSynced={isSynced}
          save={() => save()}
          clear={clear}
        />
      )}

      {tab === "paste" && (
        <PasteTab businessId={businessId} tryPaste={tryPaste} />
      )}

      <ToastMessage message={toastMessage?.message} uuid={toastMessage?.uuid} />
    </div>
  );
};

export default FinancialDataInput;
