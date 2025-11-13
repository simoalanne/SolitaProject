import { type ProjectInput } from "@myorg/shared";
import { useTranslation } from "../i18n/useTranslation";
import ToggleButton from "./ToggleButton";
import Slider from "./Slider";
import { useState } from "react";

// TODO:
// - Other components and types should be moved to separate files
// - The keys created from path arrays eg. (financialRisk.consecutiveLosses.maxAllowedLossYears) should have added i18n entries for user friendly labels
// - Styling should be improved and consistent

// NICE TO HAVE:
// - The advanced configuration could collapse and expand with an animation rather than just popping in and out when the button is clicked
// - individual sections could be collapsible to make it easier to navigate large configurations
// - tooltips that explain what each parameter/weight/rule or other non obvious option does
// - anything else that could make this "better" from a UX or technical perspective
type Path = (string | number)[];

type SliderOption = {
  path: Path;
  value: number;
  min: number;
  max: number;
  step: number;
};

type ConfigurableRule = {
  path: Path;
  params: SliderOption[];
  weight: SliderOption;
  perform: { path: Path; value: boolean };
};

type MappedConfiguration = {
  financialRiskAnalysis: ConfigurableRule[];
  fundingHistoryAnalysis: ConfigurableRule[];
  weightsConfiguration: WeightsMapped;
};

type WeightConfigEntry = Omit<SliderOption, "path">;

type WeightsConfig = {
  company: Record<string, WeightConfigEntry>;
  project: Record<string, WeightConfigEntry>;
};

type WeightsMapped = {
  companyRelated: { path: Path; weights: SliderOption[] };
  projectRelated: { path: Path; weights: SliderOption[] };
};

type ConfigSliderProps = {
  param: SliderOption;
  defaults: ProjectInput["configuration"];
  updateForm: (path: Path, value: any) => void;
  t: ReturnType<typeof useTranslation>["t"];
};

const ConfigSlider = ({
  param,
  defaults,
  updateForm,
  t,
}: ConfigSliderProps) => {
  const handleChange = (val: number) =>
    updateForm(param.path, { ...param, value: Number(val) });

  return (
    <Slider
      key={param.path.join(".")}
      label={getLabel(param.path, t)}
      value={param.value}
      min={param.min}
      max={param.max}
      step={param.step}
      defaultValue={findSliderDefault(defaults, param.path)}
      onChange={handleChange}
    />
  );
};

type RuleConfigProps = {
  rule: ConfigurableRule;
  defaults: ProjectInput["configuration"];
  updateForm: (path: Path, value: any) => void;
  t: ReturnType<typeof useTranslation>["t"];
};

const RuleConfig = ({ rule, defaults, updateForm, t }: RuleConfigProps) => (
  <div className="config-rule">
    <h4>{getLabel(rule.path, t)}</h4>
    <ToggleButton
      label={t("perform_analysis")}
      value={rule.perform.value}
      onToggle={(val) => updateForm(rule.perform.path, val)}
    />
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

type WeightsGroupProps = {
  title: string;
  weights: SliderOption[];
  defaults: ProjectInput["configuration"];
  updateForm: (path: Path, value: any) => void;
  t: ReturnType<typeof useTranslation>["t"];
};

const WeightsGroup = ({
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

const findSliderDefault = (obj: any, path: Path): number | undefined => {
  let current = obj;
  for (const segment of path) {
    current = current?.[segment];
  }
  return typeof current?.value === "number" ? current.value : undefined;
};

const getLabel = (fieldPath: Path, t: ReturnType<typeof useTranslation>["t"]) =>
  t(fieldPath.join(".") as Parameters<typeof t>[0]);

type AdvancedFormConfigurationProps = {
  updateForm: (fieldPath: Path, value: any) => void;
  configuration: ProjectInput["configuration"];
  onResetToDefaults: () => void;
  defaults?: ProjectInput["configuration"];
};

const AdvancedFormConfiguration = ({
  updateForm,
  configuration,
  onResetToDefaults,
  defaults,
}: AdvancedFormConfigurationProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Config is loaded async so wait till it's available
  if (!configuration) return;

  const mapRuleGroup = (
    group: Record<string, any>,
    basePath: Path
  ): ConfigurableRule[] =>
    Object.entries(group)
      .filter(([_, rule]) => rule.readOnly !== true)
      .map(([ruleKey, rule]) => {
        const rulePath = [...basePath, ruleKey];
        const params = Object.entries(rule)
          .filter(([k]) => !["weight", "perform", "readOnly"].includes(k))
          .map(([paramKey, v]) => ({
            path: [...rulePath, paramKey],
            ...(v as Omit<SliderOption, "path">),
          }));

        return {
          path: rulePath,
          params,
          weight: { path: [...rulePath, "weight"], ...rule.weight },
          perform: { path: [...rulePath, "perform"], value: rule.perform },
        };
      });

  const mapWeights = (weights: WeightsConfig): WeightsMapped => ({
    companyRelated: {
      path: ["weights", "company"],
      weights: Object.entries(weights.company).map(([key, value]) => ({
        path: ["weights", "company", key],
        ...value,
      })),
    },
    projectRelated: {
      path: ["weights", "project"],
      weights: Object.entries(weights.project).map(([key, value]) => ({
        path: ["weights", "project", key],
        ...value,
      })),
    },
  });

  const mapConfig = (
    config: NonNullable<ProjectInput["configuration"]>
  ): MappedConfiguration => ({
    financialRiskAnalysis: mapRuleGroup(config.financialRisk, [
      "financialRisk",
    ]),
    fundingHistoryAnalysis: mapRuleGroup(config.fundingHistory, [
      "fundingHistory",
    ]),
    weightsConfiguration: mapWeights(config.weights),
  });

  const mappedConfig = mapConfig(configuration);
  return (
    <div className="advanced-form-configuration">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ marginBottom: "20px" }}
      >
        {isOpen
          ? t("hide_advanced_configuration")
          : t("show_advanced_configuration")}
      </button>
      {isOpen && (
        <div>
          <button
            type="button"
            onClick={onResetToDefaults}
            style={{ marginBottom: "20px" }}
          >
            {t("reset_to_defaults")}
          </button>

          <div className="config-section">
            <h3>{t("financial_risk_analysis")}</h3>
            {mappedConfig.financialRiskAnalysis.map((rule) => (
              <RuleConfig
                key={rule.path.join(".")}
                rule={rule}
                defaults={defaults}
                updateForm={updateForm}
                t={t}
              />
            ))}
          </div>

          <div className="config-section">
            <h3>{t("funding_history_analysis")}</h3>
            {mappedConfig.fundingHistoryAnalysis.map((rule) => (
              <RuleConfig
                key={rule.path.join(".")}
                rule={rule}
                defaults={defaults}
                updateForm={updateForm}
                t={t}
              />
            ))}
          </div>

          <div className="config-section">
            <h3>{t("weights_configuration")}</h3>
            <WeightsGroup
              title={t("company_related_weights")}
              weights={mappedConfig.weightsConfiguration.companyRelated.weights}
              defaults={defaults}
              updateForm={updateForm}
              t={t}
            />
            <WeightsGroup
              title={t("project_related_weights")}
              weights={mappedConfig.weightsConfiguration.projectRelated.weights}
              defaults={defaults}
              updateForm={updateForm}
              t={t}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFormConfiguration;
