const fs = require("fs");

const coverage = Math.round(
  Object.values(JSON.parse(fs.readFileSync("coverage/coverage-summary.json")).total)
    .filter((entry) => entry.total)
    .map((entry) => entry.pct)
    .reduce((m, v, i, a) => m + v / a.length, 0)
);

const badge = `https://img.shields.io/badge/coverage-${coverage}%25-${
  coverage > 90 ? "green" : coverage > 50 ? "yellow" : "orange"
}.svg`;

console.log("\x1b[36m%s\x1b[0m", "Coverage badge:", badge);
