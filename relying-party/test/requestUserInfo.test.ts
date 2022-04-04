import { requestUserInfo } from "../src/requestUserInfo";
import { mockIdentityProviderPublicJWKs, mockRelyingParty, mockUserInfo } from "./mocks";

const authenticationRequest = {
  code_verifier: "",
  provider_jwks: mockIdentityProviderPublicJWKs,
  redirect_uri: "",
  revocation_endpoint: "",
  state: "",
  token_endpoint: "",
  userinfo_endpoint: "",
};

describe("request user info", () => {
  test("it fails on invalid claims format", async () => {
    await expect(
      requestUserInfo(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return {
              status: 200,
              headers: { "content-type": "application/jose" },
              body: await mockUserInfo({ "https://attributes.spid.gov.it/name": 42 }),
            };
          },
        },
        authenticationRequest,
        ""
      )
    ).rejects.toThrow("Invalid user info response");
  });
  test("it fails on bad response", async () => {
    await expect(
      requestUserInfo(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return { status: 400, headers: {}, body: "" };
          },
        },
        authenticationRequest,
        ""
      )
    ).rejects.toThrow("User info request failed");
  });
});
