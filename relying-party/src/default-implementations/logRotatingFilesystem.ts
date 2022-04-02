import * as winston from "winston";
import "winston-daily-rotate-file";
import { GeneralDailyRotateFileTransportOptions } from "winston-daily-rotate-file";
import { AbstractLogging } from "../configuration";

export function createLogRotatingFilesystem(
  options?: Pick<GeneralDailyRotateFileTransportOptions, "dirname">
): AbstractLogging {
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
        ...options,
      }),
    ],
  });

  return {
    fatal: logger.error.bind(logger),
    error: logger.error.bind(logger),
    warn: logger.warn.bind(logger),
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    trace: logger.debug.bind(logger),
  };
}
