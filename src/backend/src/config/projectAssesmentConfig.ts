const baseProjectAssessmentConfig = {
  financialRisk: {
    consecutiveLosses: {
      params: {
        maxAllowedLossYears: {
          value: 2,
          type: "integer",
          slider: { min: 0, max: 5, step: 1 },
        },
        startingIndex: {
          value: 0,
          type: "integer",
          slider: { min: 0, max: 4, step: 1 },
        },
      },
      weight: 3,
      perform: true,
    },
    lowProfitMargin: {
      params: {
        minMarginPercent: {
          value: 0.05,
          type: "decimal",
          slider: { min: 0, max: 1, step: 0.01 },
        },
      },
      weight: 1,
      perform: true,
    },
    highRevenueVolatility: {
      params: {
        maxVolatilityPercent: {
          value: 0.2,
          type: "decimal",
          slider: { min: 0, max: 1, step: 0.01 },
        },
      },
      weight: 2,
      perform: true,
    },
    revenueNotGrowing: {
      params: {
        consecutiveYearsWithoutGrowth: {
          value: 3,
          type: "integer",
          slider: { min: 0, max: 5, step: 1 },
        },
        growthRateThreshold: {
          value: 0.03,
          type: "decimal",
          slider: { min: 0.01, max: 1, step: 0.01 },
        },
      },
      weight: 3,
      perform: true,
    },
    unrealisticBudget: {
      params: {
        budgetToRevenueRatio: {
          value: 2,
          type: "decimal",
          slider: { min: 0.5, max: 5, step: 0.1 },
        },
      },
      weight: 1,
      perform: true,
      readonlyFields: ["weight", "perform"],
    },
  },
  fundingHistory: {
    tooRecentFunding: {
      params: {
        minTimeAgo: {
          value: 2,
          type: "integer",
          slider: { min: 0, max: 10, step: 1 },
        },
        startupMinTimeAgo: {
          value: 1,
          type: "integer",
          slider: { min: 0, max: 10, step: 1 },
        },
      },
      weight: 1,
      perform: true,
    },
    tooManyInstances: {
      params: {
        maxAllowed: {
          value: 2,
          type: "integer",
          slider: { min: 0, max: 10, step: 1 },
        },
        maxAllowedForStartups: {
          value: 5,
          type: "integer",
          slider: { min: 0, max: 10, step: 1 },
        },
      },
      weight: 1,
      perform: true,
    },
  },
  weights: {
    company: {
      financialRisk: 5,
      fundingHistory: 3,
      descriptionClarity: 2,
      descriptionRelevancy: 2,
    },
    project: {
      allCompanyEvaluations: 5,
      strategicFit: 2.5,
      innovation: 2.5,
    },
  },
  thresholds: {
    // In the future these could just share the same Trafficlight structure or
    // be removed altogether and let frontend transform raw scores to whatever
    // structure it wants internally
    financialRisk: { low: 1, medium: 0.66, high: 0.33 },
    fundingHistory: { high: 1, medium: 0.66, low: 0.33, none: 0 },
    trafficLight: { green: 0.75, yellow: 0.5, red: 0.25 },
  },
  shared: {
    weightSlider: { min: 0, max: 10, step: 0.5 },
  },
} as const;

export type ProjectAssessmentConfig = typeof baseProjectAssessmentConfig;

export default baseProjectAssessmentConfig;
