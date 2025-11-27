import "../../css/slider.css";
import { useEffect, useRef, useState } from "react";

type SliderProps = {
  value: number;
  label: string;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  tooltip?: string;
  readonly: boolean;
  type: "decimal" | "integer";
};

const Slider = ({
  value,
  label,
  onChange,
  min,
  max,
  step = 1,
  defaultValue,
  tooltip,
  readonly,
  type,
}: SliderProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const formatVal = (val: number) => {
    return type === "decimal" ? `${Math.round(val * 100)}%` : val;
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (
        open &&
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (open) popoverRef.current?.focus();
  }, [open]);

  return (
   <div className="slider-container" ref={wrapperRef}>
  <div className="slider-label">
    {label}
    {tooltip && (
      <span className={`slider-tooltip ${open ? "open" : ""}`}>
        <button
          type="button"
          className="slider-tooltip-button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${label.replace(/\s+/g, "-")}-popover`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((s) => !s);
          }}
        >
          <span className="slider-tooltip-icon">ⓘ</span>
        </button>
        <div
          id={`${label.replace(/\s+/g, "-")}-popover`}
          className="slider-popover"
          role="dialog"
          aria-label={label + " help"}
          tabIndex={-1}
          ref={popoverRef}
        >
          {tooltip}
        </div>
      </span>
    )}
  </div>
  <div className="slider-wrapper">
    <input
      type="range"
      min={min}
      max={max}
      disabled={readonly}
      step={step}
      value={value}
      onChange={handleChange}
      className="slider"
    />

    {defaultValue !== undefined && value !== defaultValue && (
      <div
        className="slider-default-value"
        style={{ left: `${((defaultValue - min) / (max - min)) * 100}%` }}
      >
        {formatVal(defaultValue)}
      </div>
    )}

    <div
      className="slider-value"
      style={{ left: `${((value - min) / (max - min)) * 100}%` }}
    >
      {formatVal(value)}
    </div>
  </div>
</div>

  );
};

export default Slider;
