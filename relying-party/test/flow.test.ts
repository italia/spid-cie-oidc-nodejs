import { consoleLogger, createInMemoryAsyncStorage, generateJWKS, noopLogger } from "../src";
import { ConfigurationFacadeOptions } from "../src/configuration";
import { createRelyingParty } from "../src/createRelyingParty";
import { verifyEntityConfiguration } from "../src/getTrustChain";
import { mockConfiguration } from "./mocks";

const mockRelyingParty = createRelyingParty(mockConfiguration);

describe("test whole flow happy path", () => {
  test("mock configuration is valid", async () => {
    await mockRelyingParty.validateConfiguration();
  });
  test("entity configuration endpoint happy path", async () => {
    const { createEntityConfigurationResponse } = await mockRelyingParty;
    const response = await createEntityConfigurationResponse();
    expect(response.status).toBe(200);
    const entity_configuration = (await verifyEntityConfiguration(response.body)) as any;
    expect(withoutFields(entity_configuration, ["iat", "exp"])).toEqual({
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
    const { retrieveAvailableProviders } = await mockRelyingParty;
    const providers = await retrieveAvailableProviders();
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
  let authenticationUrl: string;
  test("authorization redirect url happy path", async () => {
    const { createAuthorizationRedirectURL } = await mockRelyingParty;
    authenticationUrl = await createAuthorizationRedirectURL("http://127.0.0.1:8000/oidc/op/");
  });
  test("callback endpoint happy path", async () => {
    // TODO
  });
  test("access token revocation happy path", async () => {
    // TODO
  });
});

function withoutFields<O extends Record<string, unknown>, Fields extends keyof O>(o: O, fiels: Array<Fields>) {
  const result: O = { ...o };
  for (const field of fiels) {
    delete result[field];
  }
  return result;
}
