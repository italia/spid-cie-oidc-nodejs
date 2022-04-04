import { requestAccessToken } from "../src/requestAccessToken";
import { mockIdentityProviderPublicJWKs, mockRelyingParty } from "./mocks";

const authenticationRequest = {
  code_verifier: "",
  provider_jwks: mockIdentityProviderPublicJWKs,
  redirect_uri: "",
  revocation_endpoint: "",
  state: "",
  token_endpoint: "",
  userinfo_endpoint: "",
};

describe("request access token", () => {
  test("it fails on invalid response", async () => {
    await expect(
      requestAccessToken(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return { status: 200, headers: {}, body: "{}" };
          },
        },
        authenticationRequest,
        ""
      )
    ).rejects.toThrow(`Invalid response from token endpoint: {}`);
  });
  test("it fails on bad reponse", async () => {
    await expect(
      requestAccessToken(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return { status: 400, headers: {}, body: "" };
          },
        },
        authenticationRequest,
        ""
      )
    ).rejects.toThrow(`Access token request failed`);
  });
});
