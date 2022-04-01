import { inferAlgForJWK } from "../src/utils";

test("test jwk algorithm inference", () => {
  expect(inferAlgForJWK({ kty: "RSA" })).toBe("RS256");
  expect(inferAlgForJWK({ kty: "EC" })).toBe("ES256");
});
