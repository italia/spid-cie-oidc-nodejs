import { createAuthenticationRequest } from "../src/createAuthenticationRequest";
import { mockRelyingParty } from "./mocks";

describe("authentication request", () => {
  test("it fails on invalid provider", async () => {
    const provider = "invalid url";
    await expect(
      createAuthenticationRequest({ ...(await mockRelyingParty.getConfiguration()) }, provider)
    ).rejects.toThrow(`Provider is not a valid url ${provider}`);
  });
  test("it fails on not configured provider", async () => {
    const provider = "http://127.0.0.1:5000/invalid";
    await expect(
      createAuthenticationRequest({ ...(await mockRelyingParty.getConfiguration()) }, provider)
    ).rejects.toThrow(`Provider is not supported ${provider}`);
  });
  test("it fails if trust chain cant be found", async () => {
    const provider = "http://127.0.0.1:8000/oidc/op/";
    await expect(
      createAuthenticationRequest(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return { status: 400, headers: {}, body: "" };
          },
        },
        provider
      )
    ).rejects.toThrow(`Unable to find trust chain for identity provider ${provider}`);
  });
});
