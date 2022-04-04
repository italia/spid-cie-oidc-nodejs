import { createInMemoryAsyncStorage } from "../../src";

describe("in memory async storage", () => {
  test("it does read write delete operations", async () => {
    const storage = createInMemoryAsyncStorage();
    expect(storage.read("key")).rejects.toThrow("Key key not found");
    await storage.write("key", "value");
    expect(storage.read("key")).resolves.toBe("value");
    await storage.delete("key");
    expect(storage.read("key")).rejects.toThrow("Key key not found");
  });
});
