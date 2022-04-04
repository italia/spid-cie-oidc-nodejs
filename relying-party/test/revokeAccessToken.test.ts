import { revokeAccessToken } from "../src/revokeAccessToken";
import { mockAccessToken, mockIdToken, mockRelyingParty } from "./mocks";

test("access token revocation fails", async () => {
  await expect(
    revokeAccessToken(
      {
        ...(await mockRelyingParty.getConfiguration()),
        async httpClient() {
          return { status: 400, headers: {}, body: "" };
        },
      },
      {
        id_token: mockIdToken,
        access_token: mockAccessToken,
        refresh_token: undefined,
        revocation_endpoint: "http://127.0.0.1:8000/oidc/op/revocation/",
      }
    )
  ).rejects.toThrow("Revocation request failed");
});
