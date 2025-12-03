import { useTranslation } from "../i18n/useTranslation";
import type {
  ConfigSliderProps,
  RuleConfigProps,
  SliderOption,
  WeightsGroupProps,
  Path,
} from "./AVC_form_types";
import Slider from "./Slider";
import ToggleButton from "./ToggleButton";

export const ConfigSlider = ({
  param,
  defaults,
  updateForm,
  t,
}: ConfigSliderProps) => {
  const handleChange = (val: number) => {
    updateForm(param.path, val);
  };
  undefined;
  return (
    <Slider
      key={param.path.join(".")}
      label={getLabel(param.i18nKey || param.path, t) || humanizePath(param.path)}
      tooltip={getLabel([...(param.i18nKey || param.path), "tooltip"], t)}
      value={param.value}
      min={param.min}
      max={param.max}
      step={param.step}
      defaultValue={findSliderDefault(defaults, param.path)}
      onChange={handleChange}
      readonly={param.readonly || false}
      type={param.type}
    />
  );
};

export const RuleConfig = ({
  rule,
  defaults,
  updateForm,
  t,
}: RuleConfigProps) => (
  <div className="config-rule">
    <div className="rule-header">
      <h4 className="rule-title">{getLabel(rule.path, t)}</h4>
      {!rule.perform.readonly && (
        <div className="rule-toggle">
          <span className="rule-toggle-label">{t("in_use_question")}</span>
          <ToggleButton
            label=""
            value={rule.perform.value}
            onToggle={(val: boolean) => updateForm(rule.perform.path, val)}
            readonly={rule.perform.readonly || false}
          />
        </div>
      )}
    </div>

    {rule.perform.value && (
      <div className="rule-params">
        {rule.params.length > 0 && (
          <>
            {rule.params.map((param: SliderOption) => (
              <ConfigSlider
                key={param.path.join(".")}
                param={param}
                defaults={defaults}
                updateForm={updateForm}
                t={t}
              />
            ))}
          </>
        )}
        {!rule.weight.readonly && (
          <ConfigSlider
            key={rule.weight.path.join(".")}
            param={rule.weight}
            defaults={defaults}
            updateForm={updateForm}
            t={t}
          />
        )}
      </div>
    )}
  </div>
);

export const WeightsGroup = ({
  title,
  weights,
  defaults,
  updateForm,
  t,
}: WeightsGroupProps) => (
  <div className="weights-group">
    <h4>{title}</h4>
    {weights.map((weight) => (
      <ConfigSlider
        key={weight.path.join(".")}
        param={weight}
        defaults={defaults}
        updateForm={updateForm}
        t={t}
      />
    ))}
  </div>
);

export const findSliderDefault = (obj: any, path: Path): number | undefined => {
  let current = obj;
  for (const segment of path) {
    current = current?.[segment];
  }
  return typeof current === "number" ? current : undefined;
};

const humanizeSegment = (seg: string | number) => {
  if (typeof seg === "number") return String(seg);
  // split camelCase and snake_case, kebab-case
  const splitCamel = seg.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const replaced = splitCamel.replace(/[_\-]+/g, " ").trim();
  // collapse multiple spaces and lower-case
  const collapsed = replaced.replace(/\s+/g, " ").toLowerCase();
  // capitalize first letter
  return collapsed.charAt(0).toUpperCase() + collapsed.slice(1);
};

const humanizePath = (path: Path) => path.map(humanizeSegment).join(" — ");

export const getLabel = (
  fieldPath: Path,
  t: ReturnType<typeof useTranslation>["t"]
) => {
  const key = fieldPath.join(".") as Parameters<typeof t>[0];
  const translated = t(key);
  // If translation returns the same key string, assume missing and fall back
  if (translated === key) return;
  return translated;
};
