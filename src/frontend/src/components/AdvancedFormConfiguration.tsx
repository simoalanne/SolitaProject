import { type ProjectInput } from "@myorg/shared";
import { useTranslation } from "../i18n/useTranslation";
import Collapsible from "./Collapsible";
import type { AdvancedFormConfigurationProps, ConfigurableRule, MappedConfiguration, Path, SliderOption, WeightsConfig, WeightsMapped } from "./AVC_form_types";
import { RuleConfig, WeightsGroup } from "./AVC_form_utils";

// TODO:
// - Styling should be improved and consistent

// NICE TO HAVE:
// - The advanced configuration could collapse and expand with an animation rather than just popping in and out when the button is clicked
// - individual sections could be collapsible to make it easier to navigate large configurations
// - tooltips that explain what each parameter/weight/rule or other non obvious option does
// - anything else that could make this "better" from a UX or technical perspective

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

  const ResetButton = ({ sectionKey }: { sectionKey: keyof NonNullable<ProjectInput["configuration"]> }) => (
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
          {mappedConfig.financialRiskAnalysis.map(rule => (
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
          {mappedConfig.fundingHistoryAnalysis.map(rule => (
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
