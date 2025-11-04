import { getFinancialRiskForCompany } from "../dist/assess/financial.js";
import assert from "node:assert";
import { describe, it } from "node:test";

describe("getFinancialRiskForCompany", () => {
    it("Should return n/a with not enough data", () => {
        const data = {
            financialData: {
                revenues: [100, 200],
                profits: [20, 40],
            },
        };

        const result = getFinancialRiskForCompany(data);

        assert.ok(result);
        assert.strictEqual(result, "n/a");
    });

    it("Should return 'low' for good financials", () => {
        const data = {
            financialData: {
                revenues: [100, 120, 150, 130, 140],
                profits: [10, 12, 15, 13, 14],
            },
        };

        const result = getFinancialRiskForCompany(data);

        assert.ok(result);
        assert.strictEqual(result, "n/a");
    });

    it("Should return 'medium' for somewhat risky financials", () => {
        const data = {
            financialData: {
                revenues: [100, 100, 100, 100, 100],
                profits: [3, 2, 0, 5, 2],
            },
        };

        const result = getFinancialRiskForCompany(data);

        assert.ok(result);
        assert.strictEqual(result, "medium");
    });

    it("Should return 'high' for risky financials", () => {
        const data = {
            financialData: {
                revenues: [100, 90, 80, 70, 60],
                profits: [0, -2, -3, -2, -1],
            },
        };

        const result = getFinancialRiskForCompany(data);

        assert.ok(result);
        assert.strictEqual(result, "high");
    });
});
