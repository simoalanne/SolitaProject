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
  const handleChange = (val: number) =>
    updateForm(param.path, { ...param, value: Number(val) });

  const isRuleWeight = param.path[param.path.length - 1] === "weight";
  const isGroupWeight = param.path[0] === "weights";
  const tooltipKey = `${param.path.join(".")}.tooltip`;
  // call t with a cast because key is computed at runtime
  const rawTooltip = t(tooltipKey as Parameters<typeof t>[0]);
  let tooltip: string | undefined;
  if (rawTooltip !== (tooltipKey as unknown as string)) {
    tooltip = rawTooltip;
  } else {
    // fallback to a sensible general tooltip
    tooltip = isRuleWeight
      ? t("weight_tooltip_rule")
      : isGroupWeight
      ? t("weight_tooltip_group")
      : undefined;
  }

  return (
    <Slider
      key={param.path.join(".")}
      label={getLabel(param.path, t)}
      tooltip={tooltip}
      value={param.value}
      min={param.min}
      max={param.max}
      step={param.step}
      defaultValue={findSliderDefault(defaults, param.path)}
      onChange={handleChange}
    />
  );
};


export const RuleConfig = ({ rule, defaults, updateForm, t }: RuleConfigProps) => (
  <div className="config-rule">
    <div className="rule-header">
      <h4 className="rule-title">{getLabel(rule.path, t)}</h4>
      <div className="rule-toggle">
        <span className="rule-toggle-label">{t("in_use_question")}</span>
        <ToggleButton
          label=""
          value={rule.perform.value}
          onToggle={(val: boolean) => updateForm(rule.perform.path, val)}
        />
      </div>
    </div>

    {rule.perform.value && (
      <div className="rule-params">
        <p>{t("rule_parameters")}:</p>
        {rule.params.map((param: SliderOption) => (
          <ConfigSlider
            key={param.path.join(".")}
            param={param}
            defaults={defaults}
            updateForm={updateForm}
            t={t}
          />
        ))}
        <p>{t("rule_weight")}:</p>
        {rule.weight && (
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
  return typeof current?.value === "number" ? current.value : undefined;
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
  if (translated === key) return humanizePath(fieldPath);
  return translated;
};

