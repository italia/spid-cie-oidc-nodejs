import { AsyncStorage } from "../configuration";

export function createInMemoryAsyncStorage<T>(): AsyncStorage<T> {
  const map = new Map();
  return {
    async read(rowId) {
      if (!map.has(rowId)) {
        throw new Error(`Key ${rowId} not found`);
      }
      return map.get(rowId) as T;
    },
    async write(rowId, value) {
      map.set(rowId, value);
    },
    async delete(rowId) {
      map.delete(rowId);
    },
  };
}
