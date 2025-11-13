import express from "express";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import assessRouter from "./assess/router.ts";
import configRouter from "./config/configRouter.ts";
import companiesRouter from "./companies/router.ts";
import openApiDoc from "./openapi/openapi.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendPath = resolve(__dirname, "../../frontend/dist");

const app = express();
app.use(express.json());

app.use("/api/assess", assessRouter);
app.use("/api/config", configRouter);
app.use("/api/companies", companiesRouter);

// Serves OpenAPI spec in localhost:port/api/docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));

// Serve frontend static files
app.use(express.static(frontendPath));
// SPA fallback for React Router
app.get("/*splat", (_, res) => {
  res.sendFile(join(frontendPath, "index.html"));
});

export default app;
