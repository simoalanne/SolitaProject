import { type Request, type Response, type NextFunction } from "express";
import { ZodSchema, z } from "zod";

/**
 * Middleware factory for validating request data using a Zod schema.
 *
 * This function takes a Zod schema and a request key (`body` or `query`),
 * and returns an Express middleware that validates the corresponding
 * part of the request against the schema.
 *
 * If validation fails, it responds with a 400 status and a JSON error message.
 * If validation succeeds, it calls `next()` to continue processing the request.
 *
 * @param schema - The Zod schema used to validate the request data.
 * @param key - The part of the request to validate ("body" or "query").
 * @returns An Express middleware function that validates the specified request key.
 */
const validate =
  (schema: ZodSchema, key: "body" | "query") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[key]);
    if (!result.success) {
      res
        .status(400)
        .json({ error: result.error.errors.map((e) => e.message).join(", ") });
      return;
    }
    next();
  };

/**
 * Middleware factory for validating the request body using a Zod schema.
 *
 * This is a convenience wrapper around {@link validate} that targets `req.body`.
 *
 * @param schema - The Zod schema used to validate the request body.
 * @returns An Express middleware that validates the request body.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * import { validateBody } from "./validate";
 *
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * app.post("/users", validateBody(userSchema), (req, res) => {
 *   res.send("User created");
 * });
 * ```
 */
export const validateBody = (schema: ZodSchema) => validate(schema, "body");

/**
 * Middleware factory for validating query parameters using a Zod schema.
 *
 * This is a convenience wrapper around {@link validate} that targets `req.query`.
 *
 * @param schema - The Zod schema used to validate the query parameters.
 * @returns An Express middleware that validates the query parameters.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * import { validateQueryParams } from "./validate";
 *
 * const querySchema = z.object({
 *   page: z.string().regex(/^\d+$/),
 *   limit: z.string().regex(/^\d+$/),
 * });
 *
 * app.get("/items", validateQueryParams(querySchema), (req, res) => {
 *   res.send("Items fetched");
 * });
 * ```
 */
export const validateQueryParams = (schema: ZodSchema) =>
  validate(schema, "query");
