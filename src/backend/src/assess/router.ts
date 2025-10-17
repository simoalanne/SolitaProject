import express from "express";
import { validateBody } from "../utils/schemaValidator.ts";
import {
  ProjectInputSchema,
  ProjectOutputSchema,
} from "../../../shared/schema.ts";
import assessProject from "./service.ts";

const assessRouter = express.Router();

assessRouter.post("/", validateBody(ProjectInputSchema), async (req, res) => {
  const output = await assessProject(req.body);
  res.json(output);
});

export default assessRouter;
