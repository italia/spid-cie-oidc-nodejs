import { generateJWKS, noopLogger } from "../src";
import { createRelyingParty } from "../src/createRelyingParty";
import { verifyEntityConfiguration } from "../src/getTrustChain";

const machinery = (async () => {
  const { public_jwks, private_jwks } = await generateJWKS();
  const configuration = {
    client_id: `http://127.0.0.1:3000/oidc/rp/`,
    client_name: "My Application",
    trust_anchors: ["http://127.0.0.1:8000/"],
    identity_providers: {
      spid: ["http://127.0.0.1:8000/oidc/op/"],
      cie: ["http://127.0.0.1:8002/oidc/op/"],
    },
    logger: noopLogger,
    auditLogger: () => {},
    public_jwks,
    private_jwks,
  };
  const handlers = await createRelyingParty(configuration);
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
    // TODO setup 127.0.0.1:3000 127.0.0.1:8000 127.0.0.1:8002
    if (false) {
      const { configuration, handlers } = await machinery;
      const { retrieveAvailableProviders } = handlers;
      const providers = await retrieveAvailableProviders();
      expect(providers).toEqual({
        spid: [
          [
            {
              sub: "http://127.0.0.1:8000/oidc/op/",
              organization_name: "SPID OIDC identity provider",
              logo_uri: "http://127.0.0.1:8000/static/svg/spid-logo-c-lb.svg",
            },
          ],
        ],
        cie: [
          [
            {
              sub: "http://127.0.0.1:8002/oidc/op/",
              organization_name: "SPID OIDC identity provider",
              logo_uri: "http://127.0.0.1:8002/static/images/logo-cie.png",
            },
          ],
        ],
      });
    }
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
