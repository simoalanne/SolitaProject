import { type Request, type Response, type NextFunction } from "express";
import { ZodSchema, z } from "zod";

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

export const validateBody = (schema: ZodSchema) => validate(schema, "body");

export const validateQueryParams = (schema: ZodSchema) =>
  validate(schema, "query");
