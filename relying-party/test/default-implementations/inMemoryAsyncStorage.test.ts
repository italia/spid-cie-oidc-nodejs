import { createInMemoryAsyncStorage } from "../../src";

describe("in memory async storage", () => {
  test("it does read write delete operations", async () => {
    const storage = createInMemoryAsyncStorage();
    await expect(storage.read("key")).rejects.toThrow("Key key not found");
    await storage.write("key", "value");
    await expect(storage.read("key")).resolves.toBe("value");
    await storage.delete("key");
    await expect(storage.read("key")).rejects.toThrow("Key key not found");
  });
});
