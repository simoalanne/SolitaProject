import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z, type ZodSchema } from "zod";

/**
 * Middleware to validate request body against a given Zod schema. If validation fails, responds with 400 and error details.
 * If validation passes, route(s) that use this middleware can use the req.body as the inferred type from the schema.
 */
const validateBody =
  <T extends ZodSchema<any>>(schema: T) =>
  (
    req: Request<unknown, unknown, z.infer<T>>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: err.errors.map((e) => e.message).join(", ") });
      } else {
        next(err);
      }
    }
  };

export default validateBody;
