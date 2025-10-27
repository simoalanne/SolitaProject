import pino from "pino";
import "pino-pretty"

export const Logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});