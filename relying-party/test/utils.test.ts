import {
  inferAlgForJWK,
  generateJWKS,
  isValidURL,
  fileExists,
  readJSON,
  undiciHttpClient,
  isUndefined,
  verifyJWS,
} from "../src/utils";
import { mockRelyingPartyPublicJWKs } from "./mocks";

test("test jwk algorithm inference", () => {
  expect(inferAlgForJWK({ kty: "RSA" })).toBe("RS256");
  expect(inferAlgForJWK({ kty: "EC" })).toBe("ES256");
  expect(() => inferAlgForJWK({ kty: "unknown" })).toThrow("unsupported key type");
});

test("generate jwks", async () => {
  const result = await generateJWKS();
  expect(result.public_jwks.keys[0].kid).toBeDefined();
  expect(result.private_jwks.keys[0].kid).toBeDefined();
});

test("url validation", async () => {
  expect(isValidURL("http://example.com")).toBe(true);
  expect(isValidURL("not an url")).toBe(false);
});

test("is undefined", async () => {
  expect(isUndefined(undefined)).toBe(true);
  expect(isUndefined("")).toBe(false);
});

test("file exists", async () => {
  expect(await fileExists("package.json")).toBe(true);
  expect(await fileExists("not-a-file")).toBe(false);
});

test("read json", async () => {
  await expect(readJSON("package.json")).resolves.toBeDefined();
});

test("undici http client", async () => {
  await expect(undiciHttpClient({ url: "https://github.com/", method: "GET" })).resolves.toBeDefined();
});

describe("verify jws", () => {
  test("it correctly verifies", async () => {
    await expect(
      verifyJWS(
        "eyJhbGciOiJSUzI1NiIsImtpZCI6Imd5VmktZkFOckV6ZlphS0xyTVNpTUJnblFjcmZRVi1nR3VNMWNtRkhYX2MifQ.eyJ0ZXN0Ijp0cnVlfQ.eKUyfnrWJV_endjnwrcuvp__Q1kmxnagiUMiH897wIhIyn2jwZVimVR5mCv45xBhmpYjcTe7vqCn8aKhsoKH3CKVGJ3t0WZn1ohX7NWnUhXMtkDbun278Kknz-B8iid4DVKFX05XkWQbDNVoZXcuP6Z44KlWYipMNof9mxeaBxSChCaRXZFm4Yzjwude1J4sZeKRawiUTRTZex8UFUQ9O6ThK0t383WCNQlOtYm4iG9HEZcDTfn3pmH2y-nm04bS9Jy3mUOegWXKCb5UY-LQtV-ZaVggS3HryO27fO3b9Nzuj7V5HM25DDgheKX4lbvZDPrEb0hA5ukBckb8Dvp0fA",
        mockRelyingPartyPublicJWKs
      )
    ).resolves.toEqual({ test: true });
  });
  test("it throws if kid missing in header", async () => {
    await expect(
      verifyJWS(
        "eyJhbGciOiJSUzI1NiJ9.eyJ0ZXN0Ijp0cnVlfQ.UJuUHVShKv3_TLVtimbN1jogXmf9Nme8RfxS6uKodx5LtKU2MqLEXQ05uret2WA6aLjesxe4Bbt0Fd0ZuSG1Ue3Mj6s8aAN5so0rSINOknoBIbjHT2_9KtHbY3IsdRBnwLGeg-fXXR4Unt8vYWWVVnjpZ3R6ndbmunB3o0btJiLQjqg9aoa86rB_NvOiH5SFqiv5e3_E6J9bNt4Iw5cVIHNv_mAJ8aMiUWFwsm1mgcsTJ1pv4GtNuIfloJB4x7Z8SEjheH-mGW1kcyhcLXvXaX4a_qqc6y-cqGbmGJWleqCttMJ0IEskcH0VJcrYXzhKppNwzOrNnqSrgeKg_j0sdw",
        mockRelyingPartyPublicJWKs
      )
    ).rejects.toThrow("missing kid in header");
  });
  test("it throws if kid not found", async () => {
    await expect(
      verifyJWS(
        "eyJhbGciOiJSUzI1NiIsImtpZCI6Imd5VmktZkFOckV6ZlphS0xyTVNpTUJnblFjcmZRVi1nR3VNMWNtRkhYX2MifQ.eyJ0ZXN0Ijp0cnVlfQ.eKUyfnrWJV_endjnwrcuvp__Q1kmxnagiUMiH897wIhIyn2jwZVimVR5mCv45xBhmpYjcTe7vqCn8aKhsoKH3CKVGJ3t0WZn1ohX7NWnUhXMtkDbun278Kknz-B8iid4DVKFX05XkWQbDNVoZXcuP6Z44KlWYipMNof9mxeaBxSChCaRXZFm4Yzjwude1J4sZeKRawiUTRTZex8UFUQ9O6ThK0t383WCNQlOtYm4iG9HEZcDTfn3pmH2y-nm04bS9Jy3mUOegWXKCb5UY-LQtV-ZaVggS3HryO27fO3b9Nzuj7V5HM25DDgheKX4lbvZDPrEb0hA5ukBckb8Dvp0fA",
        { keys: [] }
      )
    ).rejects.toThrow("no matching key with kid found");
  });
});
