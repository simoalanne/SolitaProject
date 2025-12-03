import { getFinancialRiskForCompany } from "../src/assess/financial.ts";
import baseProjectAssessmentConfig from "../src/config/projectAssesmentConfig.ts";
import assert from "node:assert";
import { describe, it } from "node:test";

describe("getFinancialRiskForCompany", () => {
  it("Should return n/a for no financial data", () => {
    const data = {
      financialData: undefined,
      budget: 1000,
    };

    const result = getFinancialRiskForCompany(
      data as any,
      baseProjectAssessmentConfig.financialRisk,
      baseProjectAssessmentConfig.thresholds.financialRisk
    );

    assert.strictEqual(result.result, "n/a");
  });

  it("should return high for unrealistic budget", () => {
    const data = {
      financialData: {
        revenues: [100, 120, 130],
        profits: [10, 12, 13],
      },
      budget: 10000,
    };
    const result = getFinancialRiskForCompany(
      data as any,
      baseProjectAssessmentConfig.financialRisk,
      baseProjectAssessmentConfig.thresholds.financialRisk
    );
    assert.strictEqual(result.result, "high");
  });

  it("should return n/a for startup/R&D driven company", () => {
    const data = {
      isStartupOrRDDriven: true,
      financialData: {
        revenues: [100, 120, 130],
        profits: [10, 12, 13],
      },
      budget: 1000,
    };

    const result = getFinancialRiskForCompany(
      data as any,
      baseProjectAssessmentConfig.financialRisk,
      baseProjectAssessmentConfig.thresholds.financialRisk
    );
    assert.strictEqual(result.result, "n/a");
  });

  it("Should return 'low' for good financials", () => {
    const data = {
      financialData: {
        revenues: [100, 120, 150, 130, 140],
        profits: [10, 12, 15, 13, 14],
      },
      budget: 50,
    };

    const result = getFinancialRiskForCompany(
      data as any,
      baseProjectAssessmentConfig.financialRisk,
      baseProjectAssessmentConfig.thresholds.financialRisk
    );

    assert.ok(result);
    assert.strictEqual(result.result, "low");
  });

  it("Should return 'medium' for somewhat risky financials", () => {
    const data = {
      financialData: {
        revenues: [100, 100, 100, 100, 100],
        profits: [3, 2, 0, 5, 2],
      },
      budget: 50,
    };

    const result = getFinancialRiskForCompany(
      data as any,
      baseProjectAssessmentConfig.financialRisk,
      baseProjectAssessmentConfig.thresholds.financialRisk
    );

    assert.ok(result);
    assert.strictEqual(result.result, "medium");
  });

  it("Should return 'high' for risky financials", () => {
    const data = {
      financialData: {
        revenues: [100, 90, 80, 70, 60],
        profits: [0, -2, -3, -2, -1],
      },
    };

    const result = getFinancialRiskForCompany(
      data as any,
      baseProjectAssessmentConfig.financialRisk,
      baseProjectAssessmentConfig.thresholds.financialRisk
    );

    assert.ok(result);
    assert.strictEqual(result.result, "high");
  });
});
