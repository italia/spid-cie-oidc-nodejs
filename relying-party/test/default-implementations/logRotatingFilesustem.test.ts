import fs from "fs";
import rimraf from "rimraf";
import { createLogRotatingFilesystem } from "../../src";

describe("audit log rotating file system", () => {
  test("it should write to filesystem", async () => {
    await new Promise((resolve) => rimraf("logs/log*", resolve));
    const logger = createLogRotatingFilesystem();
    const now = new Date();
    logger.info("test");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const filename = `logs/log-${year}-${month}-${date}-${hours}.log`;
    const logFileContent = await fs.promises.readFile(filename, "utf-8");
    expect(logFileContent.replace("\r\n", "\n")).toBe(
      `{"level":"info","message":"test","metadata":{},"timestamp":"${year}-${month}-${date} ${hours}:${minutes}:${seconds}"}\n`
    );
  });
});
