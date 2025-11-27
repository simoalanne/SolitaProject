import type { ProjectInput } from "@myorg/shared";
import type useTranslation from "../i18n/useTranslation";

export type Path = (string | number)[];

export type SliderOption = {
  path: Path;
  i18nKey?: Path
  value: number;
  min: number;
  max: number;
  step: number;
  readonly?: boolean;
  type: "decimal" | "integer";
};

export type ConfigurableRule = {
  path: Path;
  params: SliderOption[];
  weight: SliderOption;
  perform: { path: Path; value: boolean, readonly?: boolean };
  readonlyFields?: string[];
};

export type MappedConfiguration = {
  financialRiskAnalysis: ConfigurableRule[];
  fundingHistoryAnalysis: ConfigurableRule[];
  weightsConfiguration: WeightsMapped;
};

export type WeightConfigEntry = Omit<SliderOption, "path">;

export type WeightsConfig = {
  company: Record<string, WeightConfigEntry>;
  project: Record<string, WeightConfigEntry>;
};

export type WeightsMapped = {
  companyRelated: { path: Path; weights: SliderOption[] };
  projectRelated: { path: Path; weights: SliderOption[] };
};

export type ConfigSliderProps = {
  param: SliderOption;
  defaults: ProjectInput["configuration"];
  updateForm: (path: Path, value: any) => void;
  t: ReturnType<typeof useTranslation>["t"];
};


export type RuleConfigProps = {
  rule: ConfigurableRule;
  defaults: ProjectInput["configuration"];
  updateForm: (path: Path, value: any) => void;
  t: ReturnType<typeof useTranslation>["t"];
};

export type AdvancedFormConfigurationProps = {
  updateForm: (fieldPath: Path, value: any) => void;
  configuration: ProjectInput["configuration"];
  onResetSectionToDefaults: (key: keyof NonNullable<ProjectInput["configuration"]>) => void;
  defaults?: ProjectInput["configuration"];
};

export type WeightsGroupProps = {
  title: string;
  weights: SliderOption[];
  defaults: ProjectInput["configuration"];
  updateForm: (path: Path, value: any) => void;
  t: ReturnType<typeof useTranslation>["t"];
};