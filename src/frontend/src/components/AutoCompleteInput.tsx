import { useState } from "react";

type AutoCompleteInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSuggestionClick: (index: number) => void;
  suggestions: string[];
  placeholder?: string;
  valueValidated: boolean;
  companyNameSuffix?: string;
  onFocus?: () => void;
  onBlur?: () => void;
};

// This component was fully vibecoded so it may have bugs :D
// Styles could be moved to CSS file but because many are conditional they
// are inline here for now.
const AutoCompleteInput = ({
  value,
  onChange,
  onSuggestionClick,
  suggestions,
  placeholder,
  valueValidated,
  companyNameSuffix,
  onFocus = () => {},
  onBlur = () => {},
}: AutoCompleteInputProps) => {
  const [focused, setFocused] = useState(false);
  const shouldShowSuggestions = focused && suggestions.length > 0;
  return (
    <div
      style={{ display: "inline-block", width: "100%", position: "relative" }}
    >
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            onFocus();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "8px",
            paddingRight: valueValidated && companyNameSuffix ? "100px" : "8px",
            fontSize: "14px",
            boxSizing: "border-box",
            border: valueValidated ? "2px solid green" : undefined,
          }}
        />
        {valueValidated && companyNameSuffix && (
          <span
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#555",
              fontSize: "14px",
              pointerEvents: "none",
            }}
          >
            {companyNameSuffix}
          </span>
        )}
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          backgroundColor: "#222",
          color: "#fff",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
          maxHeight: shouldShowSuggestions ? "300px" : "0",
          opacity: shouldShowSuggestions ? 1 : 0,
          transition: "max-height 0.3s ease, opacity 0.2s ease",
          pointerEvents: shouldShowSuggestions ? "auto" : "none",
        }}
      >
        {suggestions.map((s, i) => (
          <li
            key={i}
            onMouseDown={() => onSuggestionClick(i)}
            style={{
              padding: "8px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AutoCompleteInput;
