import { allSchemas } from "../../../shared/schema.ts";
import { generateSchema } from "@anatine/zod-openapi";

// generate OpenAPI schemas for all zod schemas defined in shared/schema.ts
const allSchemasMap = Object.entries(allSchemas).reduce(
  (acc, [key, schema]) => {
    acc[key] = generateSchema(schema);
    return acc;
  },
  {} as Record<string, object>
);

/**
 * Exposes a json object that represents the OpenAPI 3.1 specification for the backend API.
 * This can then be used by any OpenAPI compatible renderer like swagger-ui-express used currently in app.ts
 */
const openApiDoc = {
  openapi: "3.1.0",
  info: { title: "SLT Boost API", version: "1.0.0" },
  paths: {
    "/api/assess": {
      post: {
        summary:
          "Assesses how likely a project is to receive funding from Business Finland, providing detailed evaluations for each company involved as well as a weighted overall assessment for the entire project.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProjectInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProjectOutput" },
              },
            },
          },
          "400": {
            description: "Bad Request - Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrors" },
              },
            },
          },
        },
      },
    },
    "/api/config": {
      get: {
        summary:
          "Fetches the configuration that the project assessment uses by default.",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BaseConfiguration" },
              },
            },
          },
        },
      },
    },
    "/api/companies/by-business-id": {
      get: {
        summary:
          "Fetches the official name of a company given its Business ID.",
        parameters: [
          {
            name: "businessId",
            in: "query",
            required: true,
            schema: { type: "string", $ref: "#/components/schemas/BusinessId" },
            description: "The Business ID of the company to look up.",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    companies: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { $ref: "#/components/schemas/BusinessId" },
                          name: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/companies/autocomplete": {
      get: {
        summary:
          "Provides autocomplete suggestions for company names based on a partial input string. returns a list of objects with id and company name",
        parameters: [
          {
            name: "partialName",
            in: "query",
            required: true,
            schema: { type: "string", minLength: 2 },
            description: "The beginning of the company name to autocomplete.",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
            description:
              "Maximum number of suggestions to return (default is 10).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    companies: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { $ref: "#/components/schemas/BusinessId" },
                          name: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ...allSchemasMap,
    },
  },
};

export default openApiDoc;
