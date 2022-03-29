import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";

export default [
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.esm.js",
      format: "esm",
    },
    plugins: [typescript()],
  },
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.js",
      format: "cjs",
    },
    plugins: [typescript()],
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
