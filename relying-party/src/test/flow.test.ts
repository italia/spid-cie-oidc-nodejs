import { ConfigurationFacade } from "../ConfigurationFacade";
import { EndpointHandlers } from "../EndpointHandlers";
import { verifyEntityConfiguration } from "../TrustChain";

const machinery = (async () => {
  const configuration = await ConfigurationFacade({
    client_id: `http://127.0.0.1:3000/oidc/rp/`,
    client_name: "My Application",
    contacts: ["me@mail.com"],
    trust_anchors: ["http://127.0.0.1:8000/"],
    identity_providers: ["http://127.0.0.1:8000/oidc/op/"],
  });
  const handlers = await EndpointHandlers(configuration);
  return { configuration, handlers };
})();

describe("test whole flow happy path", () => {
  test("entity configuration endpoint happy path", async () => {
    const { configuration, handlers } = await machinery;
    const { entityConfiguration } = handlers;
    const response = await entityConfiguration();
    expect(response.status).toBe(200);
    const entity_configuration = await verifyEntityConfiguration(response.body as string);
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
          contacts: ["me@mail.com"],
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
  test("provider list endpoint happy path", async () => {
    const { handlers } = await machinery;
    const { providerList } = handlers;
    const response = await providerList();
    expect(response).toEqual({
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ id: "http://127.0.0.1:8000/oidc/op/", name: "", img: "" }]),
    });
  });
});

function withoutFields<O extends Record<string, unknown>, Fields extends keyof O>(o: O, fiels: Array<Fields>) {
  const result: O = { ...o };
  for (const field of fiels) {
    delete result[field];
  }
  return result;
}
