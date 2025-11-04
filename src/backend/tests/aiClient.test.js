import assert from "node:assert";
import { describe, it } from "node:test";
import { generateFeedbackForCompany } from "../dist/ai/aiClient.js";
import dotenv from "dotenv";
dotenv.config();

describe("generateFeedbackForCompany", () => {
    it("Should return strong fit feedback", async () => {
        const result = await generateFeedbackForCompany(
            "Develop a large-scale solar farm to provide renewable electricity to 50,000 households.",
            "A company specializing in photovoltaic panel installation, grid integration, and renewable energy maintenance."
        );

        assert.ok(result);
        assert.strictEqual(result.relevancy, "green");
        assert.strictEqual(result.clarity, "green");
    });
});

describe("generateFeedbackForCompany", () => {
    it("Should return weak fit feedback", async () => {
        const result = await generateFeedbackForCompany(
            "Develop a large-scale solar farm to provide renewable electricity to 50,000 households.",
            "A marketing agency focused on social media campaigns for consumer brands."
        );

        assert.ok(result);
        assert.strictEqual(result.relevancy, "red");
        assert.strictEqual(result.clarity, "green");
    })
})