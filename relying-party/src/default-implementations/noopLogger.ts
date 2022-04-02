import { AbstractLogging } from "../configuration";

function noop() {}

export const noopLogger: AbstractLogging = {
  fatal: noop,
  error: noop,
  warn: noop,
  debug: noop,
  info: noop,
  trace: noop,
};
