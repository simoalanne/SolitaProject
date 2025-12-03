import assert from "node:assert";
import { describe, it } from "node:test";
import {
  getCompanyNameFromBusinessId,
  autoCompleteCompanyName,
} from "../src/companies/service.ts";

describe("getCompanyNameFromBusinessId", () => {
  it("Should find Nokia Oyj with Business ID", async () => {
    const businessId = "0112038-9";
    const result = await getCompanyNameFromBusinessId(businessId);
    assert.strictEqual(result[0]?.name, "Nokia Oyj");
  });

  it("Should return emptry array if Business ID was invalid", async () => {
    const businessIdId = "en ole toimiva id";
    const result = await getCompanyNameFromBusinessId(businessIdId);
    assert.strictEqual(result.length, 0);
  });
});

describe("autoCompleteCompanyName", () => {
  it("Should autocomplete Nokia Oyj", async () => {
    const partialName = "Nokia";
    const limit = 1;
    const result = await autoCompleteCompanyName(partialName, limit);
    assert.strictEqual(result[0].name, "Nokia Oyj");
  });
});
