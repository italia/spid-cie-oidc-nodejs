import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";
import json from "@rollup/plugin-json";

export default [
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.esm.js",
      format: "esm",
    },
    plugins: [json(), typescript()],
  },
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.js",
      format: "cjs",
    },
    plugins: [json(), typescript()],
  },
  {
    input: "src/index.ts",
    plugins: [dts()],
    output: {
      file: `lib/index.d.ts`,
      format: "es",
    },
  },
];
