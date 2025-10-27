import pino from "pino";

export const Logger = pino({
  level: "info",
  // pino-pretty is dev dependency so it can't be used in production
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});
