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
    const matchedCompany = await getCompanyNameFromBusinessId(
      req.query.businessId as string
    );
    res.json({ companies: matchedCompany });
  }
);

companiesRouter.get(
  "/autocomplete",
  validateQueryParams(paramsAutoCompleteSchema),
  async (req, res) => {
    const { partialName, limit } = req.query as unknown as AutoCompleteQuery;
    const suggestions = await autoCompleteCompanyName(partialName, limit);
    res.json({ companies: suggestions });
  }
);

export default companiesRouter;
