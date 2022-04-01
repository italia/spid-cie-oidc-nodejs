import { generateJWKS, noopLogger } from "../src";
import { ConfigurationFacade } from "../src/ConfigurationFacade";
import { EndpointHandlers } from "../src/EndpointHandlers";
import { verifyEntityConfiguration } from "../src/TrustChain";

const machinery = (async () => {
  const { public_jwks, private_jwks } = await generateJWKS();
  const configuration = await ConfigurationFacade({
    client_id: `http://127.0.0.1:3000/oidc/rp/`,
    client_name: "My Application",
    trust_anchors: ["http://127.0.0.1:8000/"],
    identity_providers: ["http://127.0.0.1:8000/oidc/op/"],
    logger: noopLogger,
    auditLogger() {},
    public_jwks,
    private_jwks,
  });
  const handlers = await EndpointHandlers(configuration);
  await handlers.validateConfiguration();
  return { configuration, handlers };
})();

describe("test whole flow happy path", () => {
  test("entity configuration endpoint happy path", async () => {
    const { configuration, handlers } = await machinery;
    const { createEntityConfigurationResponse } = handlers;
    const response = await createEntityConfigurationResponse();
    expect(response.status).toBe(200);
    const entity_configuration = await verifyEntityConfiguration(response.body);
    expect(withoutFields(entity_configuration, ["iat", "exp"])).toEqual({
      iss: "http://127.0.0.1:3000/oidc/rp/",
      sub: "http://127.0.0.1:3000/oidc/rp/",
      jwks: configuration.public_jwks,
      metadata: {
        openid_relying_party: {
          application_type: "web",
          client_id: "http://127.0.0.1:3000/oidc/rp/",
          client_registration_types: ["automatic"],
          jwks: configuration.public_jwks,
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
    // TODO
  });
  test("authorization redirect url happy path", async () => {
    // TODO
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
