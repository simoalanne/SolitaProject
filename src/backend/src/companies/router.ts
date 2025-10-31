import express from "express";
import { z } from "zod";
import { validateQueryParams } from "../utils/schemaValidator.ts";
import { businessIdSchema } from "@myorg/shared";
import {
  getCompanyNameFromBusinessId,
  autoCompleteCompanyName,
} from "./service.ts";

const paramsBusinessIdSchema = z.object({
  businessId: businessIdSchema,
});

const paramsAutoCompleteSchema = z.object({
  partialName: z.string().min(1),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("10"),
});

type AutoCompleteQuery = z.infer<typeof paramsAutoCompleteSchema>;

const companiesRouter = express.Router();

companiesRouter.get(
  "/by-business-id",
  validateQueryParams(paramsBusinessIdSchema),
  async (req, res) => {
    const resolvedName = await getCompanyNameFromBusinessId(
      req.query.businessId as string
    );
    if (!resolvedName)
      return res.status(404).json({ error: "Company not found" });
    res.json({ name: resolvedName });
  }
);

companiesRouter.get(
  "/autocomplete",
  validateQueryParams(paramsAutoCompleteSchema),
  async (req, res) => {
    const { partialName, limit } = req.query as unknown as AutoCompleteQuery;
    const suggestions = await autoCompleteCompanyName(partialName, limit);
    if (suggestions.length === 0)
      return res.status(404).json({ error: "No companies found" });
    res.json({ suggestions });
  }
);

export default companiesRouter;
