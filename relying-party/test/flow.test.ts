import { verifyEntityConfiguration } from "../src/getTrustChain";
import { verifyJWS } from "../src/utils";
import { mockAccessToken, mockConfiguration, mockIdToken, mockRelyingParty } from "./mocks";

describe("test whole flow happy path", () => {
  test("mock configuration is valid", async () => {
    await mockRelyingParty.validateConfiguration();
  });
  test("entity configuration endpoint happy path", async () => {
    const response = await mockRelyingParty.createEntityConfigurationResponse();
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("application/entity-statement+jwt");
    const { iat, exp, ...entity_configuration } = (await verifyEntityConfiguration(response.body)) as any;
    expect(entity_configuration).toEqual({
      iss: "http://127.0.0.1:3000/oidc/rp/",
      sub: "http://127.0.0.1:3000/oidc/rp/",
      jwks: mockConfiguration.public_jwks,
      metadata: {
        openid_relying_party: {
          application_type: "web",
          client_id: "http://127.0.0.1:3000/oidc/rp/",
          client_registration_types: ["automatic"],
          jwks: mockConfiguration.public_jwks,
          client_name: "My Application",
          grant_types: ["refresh_token", "authorization_code"],
          redirect_uris: ["http://127.0.0.1:3000/oidc/rp/callback"],
          response_types: ["code"],
          subject_type: "pairwise",
        },
      },
      trust_marks: [],
      authority_hints: ["http://127.0.0.1:8000/"],
    });
  });
  test("provider list happy path", async () => {
    const providers = await mockRelyingParty.retrieveAvailableProviders();
    expect(providers).toEqual({
      spid: [
        {
          sub: "http://127.0.0.1:8000/oidc/op/",
          organization_name: "SPID OIDC identity provider",
          logo_uri: "http://127.0.0.1:8000/static/svg/spid-logo-c-lb.svg",
        },
      ],
      cie: [],
    });
  });
  test("authorization redirect url happy path", async () => {
    const authenticationUrl = new URL(
      await mockRelyingParty.createAuthorizationRedirectURL("http://127.0.0.1:8000/oidc/op/")
    );
    expect(authenticationUrl.origin).toBe("http://127.0.0.1:8000");
    expect(authenticationUrl.pathname).toBe("/oidc/op/authorization");
    const searchParams = Object.fromEntries(authenticationUrl.searchParams.entries());
    const { state, nonce, code_challenge, iat, request, ...deterministicSearchParams } = searchParams;
    expect(deterministicSearchParams).toEqual({
      scope: "openid",
      redirect_uri: "http://127.0.0.1:3000/oidc/rp/callback",
      response_type: "code",
      client_id: "http://127.0.0.1:3000/oidc/rp/",
      endpoint: "http://127.0.0.1:8000/oidc/op/authorization",
      acr_values: "https://www.spid.gov.it/SpidL2",
      aud: '["http://127.0.0.1:8000/oidc/op/","http://127.0.0.1:8000/oidc/op/authorization"]',
      claims:
        '{"id_token":{},"userinfo":{"https://attributes.spid.gov.it/name":null,"https://attributes.spid.gov.it/familyName":null,"https://attributes.spid.gov.it/email":null,"https://attributes.spid.gov.it/fiscalNumber":null}}',
      code_challenge_method: "S256",
      prompt: "consent login",
    });
    const requestContent = await verifyJWS(request, mockConfiguration.public_jwks);
    expect(requestContent).toEqual({
      scope: "openid",
      redirect_uri: "http://127.0.0.1:3000/oidc/rp/callback",
      response_type: "code",
      nonce,
      state,
      client_id: "http://127.0.0.1:3000/oidc/rp/",
      endpoint: "http://127.0.0.1:8000/oidc/op/authorization",
      acr_values: "https://www.spid.gov.it/SpidL2",
      iat: Number(iat),
      aud: ["http://127.0.0.1:8000/oidc/op/", "http://127.0.0.1:8000/oidc/op/authorization"],
      claims: {
        id_token: {},
        userinfo: {
          "https://attributes.spid.gov.it/name": null,
          "https://attributes.spid.gov.it/familyName": null,
          "https://attributes.spid.gov.it/email": null,
          "https://attributes.spid.gov.it/fiscalNumber": null,
        },
      },
      prompt: "consent login",
      code_challenge,
      code_challenge_method: "S256",
      iss: "http://127.0.0.1:3000/oidc/rp/",
      sub: "http://127.0.0.1:3000/oidc/rp/",
    });
  });
  test("callback endpoint happy path", async () => {
    const auth = await mockRelyingParty.createAuthorizationRedirectURL("http://127.0.0.1:8000/oidc/op/");
    const state = new URL(auth).searchParams.get("state") as string;
    const outcome = await mockRelyingParty.manageCallback({ state, code: "" });
    expect(outcome).toEqual({
      type: "authentication-success",
      user_info: {
        sub: "e6b06083c2644bdc06f5a1cea22e6538b8fd59fc091837938c5969a8390be944",
        "https://attributes.spid.gov.it/name": "peppe",
        "https://attributes.spid.gov.it/familyName": "maradona",
        "https://attributes.spid.gov.it/email": "that@ema.il",
        "https://attributes.spid.gov.it/fiscalNumber": "8sada89s7da89sd7a98sd78",
      },
      tokens: {
        id_token: mockIdToken,
        access_token: mockAccessToken,
        refresh_token: undefined,
        revocation_endpoint: "http://127.0.0.1:8000/oidc/op/revocation/",
      },
    });
  });
  test("access token revocation happy path", async () => {
    await mockRelyingParty.revokeTokens({
      id_token: mockIdToken,
      access_token: mockAccessToken,
      refresh_token: undefined,
      revocation_endpoint: "http://127.0.0.1:8000/oidc/op/revocation/",
    });
  });
});
