function noop() {}

export const noopLogger = {
  fatal: noop,
  error: noop,
  warn: noop,
  debug: noop,
  info: noop,
  trace: noop,
};
