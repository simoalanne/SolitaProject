import { type Configuration, type ProjectInput } from "@myorg/shared";
import { useTranslation } from "../i18n/useTranslation";
import Collapsible from "./Collapsible";
import type {
  AdvancedFormConfigurationProps,
  ConfigurableRule,
  MappedConfiguration,
  Path,
  WeightsMapped,
} from "./AVC_form_types";
import { RuleConfig, WeightsGroup } from "./AVC_form_utils";

const AdvancedFormConfiguration = ({
  updateForm,
  configuration,
  onResetSectionToDefaults,
  defaults,
}: AdvancedFormConfigurationProps) => {
  const { t } = useTranslation();

  // Config is loaded async so wait till it's available
  if (!configuration) return;

  const mapRuleGroup = (
    group: Configuration["financialRisk"] | Configuration["fundingHistory"],
    slider: Configuration["shared"]["weightSlider"],
    basePath: Path
  ): ConfigurableRule[] =>
    Object.entries(group).map(([ruleKey, rule]) => {
      const rulePath = [...basePath, ruleKey];
      const params = Object.entries(rule.params || {}).map(
        ([paramKey, v], index) => ({
          path: [...rulePath, "params", paramKey, "value"],
          value: v.value,
          i18nKey: [...rulePath, paramKey],
          ...v.slider,
          readonly:
            rule.readonlyFields?.includes(`params.${index}` as any) || false,
          type: v.type,
        })
      );

      return {
        path: rulePath,
        params,
        weight: {
          path: [...rulePath, "weight"],
          value: rule.weight,
          i18nKey: ["weight"],
          ...slider,
          readonly: rule.readonlyFields?.includes("weight") || false,
          type: "integer",
        },
        perform: {
          path: [...rulePath, "perform"],
          value: rule.perform,
          readonly: rule.readonlyFields?.includes("perform") || false,
        },
      };
    });

  const mapWeights = (
    weights: Configuration["weights"],
    slider: Configuration["shared"]["weightSlider"]
  ): WeightsMapped => ({
    companyRelated: {
      path: ["weights", "company"],
      weights: Object.entries(weights.company).map(([key, value]) => ({
        path: ["weights", "company", key],
        value,
        ...slider,
        type: "integer",
      })),
    },
    projectRelated: {
      path: ["weights", "project"],
      weights: Object.entries(weights.project).map(([key, value]) => ({
        path: ["weights", "project", key],
        value,
        ...slider,
        type: "integer",
      })),
    },
  });

  const mapConfig = (config: Configuration): MappedConfiguration => ({
    financialRiskAnalysis: mapRuleGroup(
      config.financialRisk,
      config.shared.weightSlider,
      ["financialRisk"]
    ),
    fundingHistoryAnalysis: mapRuleGroup(
      config.fundingHistory,
      config.shared.weightSlider,
      ["fundingHistory"]
    ),
    weightsConfiguration: mapWeights(
      config.weights,
      config.shared.weightSlider
    ),
  });

  const mappedConfig = mapConfig(configuration);

  const ResetButton = ({
    sectionKey,
  }: {
    sectionKey: keyof NonNullable<ProjectInput["configuration"]>;
  }) => (
    <button
      type="button"
      onClick={() => onResetSectionToDefaults(sectionKey)}
      style={{ marginBottom: 20 }}
    >
      {t("reset_to_defaults")}
    </button>
  );

  return (
    <div className="advanced-form-configuration">
      <Collapsible label={t("show_advanced_configuration")} defaultOpen={false}>
        <Collapsible label={t("financial_risk_analysis")} defaultOpen={false}>
          <br />
          <ResetButton sectionKey="financialRisk" />
          {mappedConfig.financialRiskAnalysis.map((rule) => (
            <RuleConfig
              key={rule.path.join(".")}
              rule={rule}
              defaults={defaults}
              updateForm={updateForm}
              t={t}
            />
          ))}
          <br />
        </Collapsible>

        <Collapsible label={t("funding_history_analysis")} defaultOpen={false}>
          <br />
          <ResetButton sectionKey="fundingHistory" />
          {mappedConfig.fundingHistoryAnalysis.map((rule) => (
            <RuleConfig
              key={rule.path.join(".")}
              rule={rule}
              defaults={defaults}
              updateForm={updateForm}
              t={t}
            />
          ))}
          <br />
        </Collapsible>

        <Collapsible label={t("weights_configuration")} defaultOpen={false}>
          <br />
          <ResetButton sectionKey="weights" />
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
        </Collapsible>
        <br />
      </Collapsible>
    </div>
  );
};

export default AdvancedFormConfiguration;
