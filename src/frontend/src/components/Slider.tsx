import "../../css/slider.css";
import { useEffect } from "react";

type SliderProps = {
  value: number;
  label: string;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
};

const Slider = ({
  value,
  label,
  onChange,
  min,
  max,
  step = 1,
  defaultValue,
}: SliderProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };
  useEffect(() => {
    console.log("Mounted", label);
    return () => console.log("Unmounted", label);
  }, []);

  return (
   <div className="slider-container">
  <p className="slider-label">{label}</p>
  <div className="slider-wrapper">
    <input
      type="range"
      min={min}
      max={max}
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
        {defaultValue}
      </div>
    )}

    <div
      className="slider-value"
      style={{ left: `${((value - min) / (max - min)) * 100}%` }}
    >
      {value}
    </div>
  </div>
</div>

  );
};

export default Slider;
