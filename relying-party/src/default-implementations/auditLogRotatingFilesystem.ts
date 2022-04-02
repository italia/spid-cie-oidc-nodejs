import * as winston from "winston";
import "winston-daily-rotate-file";
import { GeneralDailyRotateFileTransportOptions } from "winston-daily-rotate-file";

export function createAuditLogRotatingFilesystem(options?: Pick<GeneralDailyRotateFileTransportOptions, "dirname">) {
  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.metadata(),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.DailyRotateFile({
        dirname: "logs",
        filename: "audit-%DATE%.log",
        datePattern: "YYYY-MM-DD-HH",
        zippedArchive: true,
        maxSize: "20m",
        ...options,
      }),
    ],
  });

  return function auditLogRotatingFilesystem(message: any) {
    logger.info(message);
  };
}
