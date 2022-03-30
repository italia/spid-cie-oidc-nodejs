import * as winston from "winston";
import { LogLevel } from "../utils";
import "winston-daily-rotate-file";

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      dirname: "logs",
      filename: "log-%DATE%.log",
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
    }),
  ],
});

export function logRotatingFilesystem(level: LogLevel, message: Error | string | object) {
  logger[level](message as any);
}
