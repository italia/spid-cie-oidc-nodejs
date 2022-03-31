export type LogLevels = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export type AbstractLogging = {
  [K in LogLevels]: (...args: any[]) => void;
};
