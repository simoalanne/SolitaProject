import { useContext } from "react";
import { ThemeContext } from "../ThemeContext";
import "../../css/toggleButton.css";

type ToggleButtonProps = {
  value: boolean;
  label: string;
  onToggle: (value: boolean) => void;
  readonly: boolean;
};

const ToggleButton = ({ value, label, onToggle, readonly }: ToggleButtonProps) => {
  const { theme } = useContext(ThemeContext);
  return (
    <div className="toggle-button-container">
      <p className="toggle-button-label">{label}</p>
      <button
        type="button"
        className={`toggle-button ${value ? "on" : "off"} ${theme}`}
        onClick={() => onToggle(!value)}
        aria-pressed={value}
        disabled={readonly}
      >
        <div className="toggle-thumb" />
      </button>
    </div>
  );
};

export default ToggleButton;
