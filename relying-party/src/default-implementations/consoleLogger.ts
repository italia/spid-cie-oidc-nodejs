import { AbstractLogging } from "../configuration";

export const consoleLogger: AbstractLogging = {
  fatal: console.error,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  info: console.info,
  trace: console.trace,
};
