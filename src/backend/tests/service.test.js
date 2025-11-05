import assert from "node:assert";
import { describe, it } from "node:test";
import { getCompanyNameFromBusinessId, autoCompleteCompanyName } from "../dist/companies/service.js";


describe("getCompanyNameFromBusinessId", () => {
    it("Should find Nokia Oyj with Business ID", async () => {
        const id = "0112038-9";
        const result = await getCompanyNameFromBusinessId(id)

        assert.ok(result);
        assert.strictEqual(result, "Nokia Oyj");
    });

    it("Should return null if Business ID was invalid", async () => {
        const faultyId = "en ole toimiva id";
        const result = await getCompanyNameFromBusinessId(faultyId);

        assert.strictEqual(result, null);
    });
});

describe("autoCompleteCompanyName", () => {
    it("Should autocomplete Nokia Oyj", async () => {
        const partialName = "Nokia";
        const limit = 1;
        const result = await autoCompleteCompanyName(partialName, limit);

        assert.ok(result);
        assert.strictEqual(result[0].name, "Nokia Oyj");
    });
});