import * as jose from "jose";
import { applyMetadataPolicy, getEntityConfiguration, getTrustChain } from "../src/getTrustChain";
import { getEntityStatement } from "../src/getTrustChain";
import { mockRelyingParty, mockRelyingPartyEntityConfiguration } from "./mocks";
import { createJWS, makeExp, makeIat } from "../src/utils";

describe("get trust chain", () => {});

describe("trust anchor key pinning", () => {
  const TRUST_ANCHOR = "http://127.0.0.1:8000/";

  // Build a Trust Anchor Entity Configuration signed with an attacker key, whose
  // embedded jwks are the attacker's own keys. This is exactly what a network
  // attacker (MITM / rogue DNS) would serve to take over the federation.
  async function rogueTrustAnchorEntityConfiguration() {
    const { publicKey, privateKey } = await jose.generateKeyPair("RS256", { extractable: true });
    const publicJwk = { ...(await jose.exportJWK(publicKey)), kid: "attacker-key", use: "sig", alg: "RS256" };
    const privateJwk = { ...(await jose.exportJWK(privateKey)), kid: "attacker-key", use: "sig", alg: "RS256" };
    const jws = await createJWS(
      {
        exp: makeExp(),
        iat: makeIat(),
        iss: TRUST_ANCHOR,
        sub: TRUST_ANCHOR,
        jwks: { keys: [publicJwk] },
        metadata: {
          federation_entity: {
            contacts: ["ops@localhost"],
            federation_fetch_endpoint: "http://127.0.0.1:8000/fetch/",
            federation_resolve_endpoint: "http://127.0.0.1:8000/resolve/",
            federation_status_endpoint: "http://127.0.0.1:8000/trust_mark_status/",
            homepage_uri: "http://127.0.0.1:8000",
            name: "attacker TA",
            federation_list_endpoint: "http://127.0.0.1:8000/list/",
          },
        },
        trust_marks_issuers: {},
        constraints: { max_path_length: 1 },
      },
      privateJwk
    );
    return jws;
  }

  test("a trust anchor entity configuration signed with untrusted keys is rejected", async () => {
    const configuration = await mockRelyingParty.getConfiguration();
    const rogue = await rogueTrustAnchorEntityConfiguration();

    await expect(
      getEntityConfiguration(
        {
          ...configuration,
          async httpClient() {
            return {
              status: 200,
              headers: { "content-type": "application/entity-statement+jwt" },
              body: rogue,
            };
          },
        },
        TRUST_ANCHOR,
        (() => true) as any,
        // Verify against the genuine, pinned keys.
        configuration.trust_anchors_jwks[TRUST_ANCHOR]
      )
    ).rejects.toThrow();
  });

  test("getTrustChain fails when the trust anchor is served with untrusted keys", async () => {
    const configuration = await mockRelyingParty.getConfiguration();
    const rogue = await rogueTrustAnchorEntityConfiguration();

    const trustChain = await getTrustChain(
      {
        ...configuration,
        async httpClient(request) {
          if (request.url === `${TRUST_ANCHOR}.well-known/openid-federation`) {
            return { status: 200, headers: { "content-type": "application/entity-statement+jwt" }, body: rogue };
          }
          return configuration.httpClient(request);
        },
      },
      "http://127.0.0.1:8000/oidc/op/"
    );

    // The rogue trust anchor must not yield a usable trust chain.
    expect(trustChain).toBeNull();
  });
});

describe("get entity statement", () => {
  const descendant = { sub: "" } as any;
  const superior = { metadata: { federation_entity: { federation_fetch_endpoint: "" } } } as any;
  test("it fails on bad response", async () => {
    await expect(
      getEntityStatement(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return { status: 400, headers: {}, body: "" };
          },
        },
        descendant,
        superior
      )
    ).rejects.toThrow(`Expected status 200 but got 400`);
  });
  test("it fails on bad response headers", async () => {
    await expect(
      getEntityStatement(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
              body: "",
            };
          },
        },
        descendant,
        superior
      )
    ).rejects.toThrow(`Expected content-type application/entity-statement+jwt but got application/json`);
  });
});

describe("get entity configuration", () => {
  test("it fails on bad response headers", async () => {
    await expect(
      getEntityConfiguration(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
              body: "",
            };
          },
        },
        "",
        (() => true) as any
      )
    ).rejects.toThrow(`Expected content-type application/entity-statement+jwt but got application/json`);
  });
  test("it fails if entity configuration has missing pieces", async () => {
    await expect(
      getEntityConfiguration(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return {
              status: 200,
              headers: {
                "content-type": "application/entity-statement+jwt",
              },
              body: await mockRelyingPartyEntityConfiguration(),
            };
          },
        },
        "",
        (() => false) as any
      )
    ).rejects.toThrow(`Malformed entity configuration`);
  });
});

test("apply metadata policy", () => {
  expect(
    applyMetadataPolicy(
      {
        "relying-party": {
          "field-add": ["a"],
          "field-subset_of": ["a", "d"],
          "field-superset_of": ["a"],
          "field-one_of": "c",
        },
      },
      {
        "relying-party": {
          "field-add": { add: "add" },
          "field-value": { value: "value" },
          "field-default": { default: "default" },
          "field-subset_of": { subset_of: ["a", "b", "c"] },
          "field-superset_of": { superset_of: ["a", "b"] },
          "field-one_of": { one_of: ["a", "b"] },
        },
      }
    )
  ).toEqual({
    "relying-party": {
      "field-add": ["a", "add"],
      "field-value": "value",
      "field-default": "default",
    },
  });
});
