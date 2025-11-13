import express from "express";
import baseProjectAssessmentConfig from "./projectAssesmentConfig.ts";

const configRouter = express.Router();

// The reason why this config doesn't just live in the shared package is because
// backend will eventually support loading the default config from a json file
// and then frontends default settings should always be in sync with backends
// default settings.
configRouter.get("/", (_, res) => {
  res.json(baseProjectAssessmentConfig);
});

export default configRouter;
