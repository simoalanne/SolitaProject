// Place holder loader component
import React from "react";
import { useTranslation } from "../i18n/useTranslation";

interface LoaderProps {
  message?: string;
  size?: number;
}

// Message and size are hardcoded for simplicity, but can be made customizable via props
const Loader: React.FC<LoaderProps> = ({ message, size = 50 }) => {
  const { t } = useTranslation();
  const displayMessage = message ?? t("loading");

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div
        className="spinner" 
        style={{
          width: size,
          height: size,
          border: `${size / 10}px solid var(--text-color)`,
          borderTop: `${size / 10}px solid #3498db`,
          borderRadius: "50%",
          animation: "spin 2s linear infinite",
          alignSelf: "center",
          justifySelf: "center",
        }}
      ></div>
      <p>{displayMessage}</p>  
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Loader;