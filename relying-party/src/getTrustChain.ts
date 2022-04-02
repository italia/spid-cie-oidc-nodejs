import * as jose from "jose";
import { ajv, httpRequest, inferAlgForJWK, makeIat } from "./utils";
import {
  TrustAnchorEntityConfiguration,
  IdentityProviderEntityConfiguration,
  RelyingPartyEntityConfiguration,
} from "./createEntityConfiguration";
import { cloneDeep, difference, intersection } from "lodash";
import { Configuration, JWKs, TrustMark } from "./configuration";
import { JSONSchemaType, ValidateFunction } from "ajv";

// SHOULDDO implement arbitray length tst chain validation
// SHOULDDO check authority hints
async function getAndVerifyTrustChain(
  configuration: Configuration,
  relying_party: string,
  identity_provider: string,
  trust_anchor: string
) {
  const relying_party_entity_configuration = await getEntityConfiguration(
    relying_party,
    validateRelyingPartyEntityConfiguration
  );
  const identity_provider_entity_configuration = await getEntityConfiguration(
    identity_provider,
    validateIdentityProviderEntityConfiguration
  );
  const trust_anchor_entity_configuration = await getEntityConfiguration(
    trust_anchor,
    validateTrustAnchorEntityConfiguration
  );
  const relying_party_entity_statement = await getEntityStatement(
    relying_party_entity_configuration,
    trust_anchor_entity_configuration
  );
  const identity_provider_entity_statement = await getEntityStatement(
    identity_provider_entity_configuration,
    trust_anchor_entity_configuration
  );
  const exp = Math.min(relying_party_entity_statement.exp, identity_provider_entity_statement.exp);
  const metadata = applyMetadataPolicy(
    identity_provider_entity_configuration.metadata,
    identity_provider_entity_statement.metadata_policy
  );
  const entity_configuration = {
    ...identity_provider_entity_configuration,
    metadata,
  };
  configuration.logger.info({
    message: "Trust chain verified",
    relying_party,
    identity_provider,
    trust_anchor,
    relying_party_entity_configuration,
    identity_provider_entity_configuration,
    relying_party_entity_statement,
    identity_provider_entity_statement,
    exp,
    metadata,
  });
  return { exp, entity_configuration };
}

async function getEntityStatement(
  descendant: RelyingPartyEntityConfiguration | IdentityProviderEntityConfiguration,
  superior: TrustAnchorEntityConfiguration
): Promise<EntityStatement> {
  try {
    const response = await httpRequest({
      url: `${superior.metadata.federation_entity.federation_fetch_endpoint}?sub=${descendant.sub}`,
      method: "GET",
    });
    if (response.status !== 200) {
      throw new Error(`Expected status 200 but got ${response.status}`);
    }
    if (!response.headers["content-type"]?.startsWith("application/entity-statement+jwt")) {
      throw new Error(
        `Expected content-type application/entity-statement+jwt but got ${response.headers["content-type"]}`
      );
    }
    const jws = await response.body;
    const { payload } = await jose.compactVerify(jws, async (header) => {
      if (!header.kid) throw new Error("missing kid in header");
      const jwk = superior.jwks.keys.find((key: any) => key.kid === header.kid);
      if (!jwk) throw new Error("no matching key with kid found");
      return await jose.importJWK(jwk, inferAlgForJWK(jwk));
    });
    return JSON.parse(new TextDecoder().decode(payload));
  } catch (error) {
    throw new Error(
      `Failed to get entity statement for ${descendant.sub} from ${superior.metadata.federation_entity.federation_fetch_endpoint} beacuse of ${error}`
    );
  }
}

async function getEntityConfiguration<T>(url: string, validateFunction: ValidateFunction<T>): Promise<T> {
  try {
    // SHOULDDO when doing post request ensure timeout and ssl is respected
    const response = await httpRequest({
      url: url + ".well-known/openid-federation",
      method: "GET",
    });
    const jws = await response.body;
    if (response.status !== 200) {
      throw new Error(`Expected status 200 but got ${response.status}`);
    }
    if (!response.headers["content-type"]?.startsWith("application/entity-statement+jwt")) {
      throw new Error(
        `Expected content-type application/entity-statement+jwt but got ${response.headers["content-type"]}`
      );
    }
    const entity_configuration = await verifyEntityConfiguration(jws);
    if (!validateFunction(entity_configuration)) {
      throw new Error(
        `Malformed entity configuration ${JSON.stringify(entity_configuration)} ${JSON.stringify(
          validateFunction.errors
        )}`
      );
    }
    return entity_configuration;
  } catch (error) {
    throw new Error(`Failed to get entity configuration for ${url} because of ${error}`);
  }
}

type EntityStatement = {
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  jwks: { keys: Array<jose.JWK> };
  metadata_policy: MetadataPolicy;
  trust_marks: Array<{ id: string; trust_mark: string }>;
};

type MetadataPolicy = Record<
  string,
  Record<
    string,
    {
      value?: string;
      add?: string;
      default?: string;
      subset_of?: Array<string>;
      superset_of?: Array<string>;
      one_of?: Array<string>;
    }
  >
>;

function applyMetadataPolicy(metadata: any, policy: MetadataPolicy) {
  metadata = cloneDeep(metadata);
  for (const [parentField, parentPolicy] of Object.entries(policy)) {
    if (!(parentField in metadata)) continue;
    for (const [childField, childPolicy] of Object.entries(parentPolicy)) {
      if (childPolicy.add) {
        metadata[parentField][childField] = [...(metadata[parentField][childField] ?? []), childPolicy.add];
      }
      if (childPolicy.value) {
        metadata[parentField][childField] = childPolicy.value;
      }
      if (childPolicy.default) {
        if (!(childField in metadata[parentField])) {
          metadata[parentField][childField] = childPolicy.value;
        }
      }
      if (childPolicy.subset_of) {
        if (intersection(metadata[parentField][childField], childPolicy.subset_of).length === 0) {
          delete metadata[parentField][childField];
        }
      }
      if (childPolicy.superset_of) {
        if (difference(metadata[parentField][childField], childPolicy.superset_of).length === 0) {
          delete metadata[parentField][childField];
        }
      }
      if (childPolicy.one_of) {
        if (!childPolicy.one_of.includes(metadata[parentField][childField])) {
          delete metadata[parentField][childField];
        }
      }
    }
  }
  return metadata;
}

export async function verifyEntityConfiguration(jws: string): Promise<unknown> {
  const decoded: any = jose.decodeJwt(jws);
  const { payload } = await jose.compactVerify(jws, async (header) => {
    if (!header.kid) throw new Error("missing kid in header");
    const jwk = decoded.jwks.keys.find((key: any) => key.kid === header.kid);
    if (!jwk) throw new Error("no matching key with kid found");
    return await jose.importJWK(jwk, inferAlgForJWK(jwk));
  });
  const entity_configuration = JSON.parse(new TextDecoder().decode(payload));
  return entity_configuration;
}

const trustChainCache = new Map<string, Awaited<ReturnType<typeof getAndVerifyTrustChain>>>();
async function CachedTrustChain(
  configuration: Configuration,
  relying_party: string,
  identity_provider: string,
  trust_anchor: string
) {
  const cacheKey = `${relying_party}-${identity_provider}-${trust_anchor}`;
  const cached = trustChainCache.get(cacheKey);
  const now = makeIat();
  if (cached && cached.exp > now) {
    return cached;
  } else {
    const trust_chain = await getAndVerifyTrustChain(configuration, relying_party, identity_provider, trust_anchor);
    trustChainCache.set(cacheKey, trust_chain);
    return trust_chain;
  }
}

export async function getTrustChain(configuration: Configuration, provider: string) {
  const identityProviderTrustChain =
    (
      await Promise.all(
        configuration.trust_anchors.map(async (trust_anchor) => {
          try {
            return await CachedTrustChain(configuration, configuration.client_id, provider, trust_anchor);
          } catch (error) {
            configuration.logger.warn(error);
            return null;
          }
        })
      )
    ).find((trust_chain) => trust_chain !== null) ?? null;
  return identityProviderTrustChain;
}

const jwksSchema: JSONSchemaType<JWKs> = {
  type: "object",
  properties: {
    keys: {
      type: "array",
      items: {
        type: "object",
      },
    },
  },
  required: ["keys"],
};

const trustMarksSchema: JSONSchemaType<Array<TrustMark>> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      trust_mark: { type: "string" },
    },
    required: ["id", "trust_mark"],
  },
};

const relyingPartyEntityConfigurationSchema: JSONSchemaType<RelyingPartyEntityConfiguration> = {
  type: "object",
  properties: {
    iss: { type: "string" },
    sub: { type: "string" },
    iat: { type: "number" },
    exp: { type: "number" },
    jwks: jwksSchema,
    trust_marks: { type: "array" } as any,
    authority_hints: { type: "array", items: { type: "string" } },
    metadata: {
      type: "object",
      properties: {
        openid_relying_party: {
          type: "object",
          properties: {
            client_name: { type: "string" },
            client_id: { type: "string" },
            application_type: { type: "string" },
            contacts: { type: "array", items: { type: "string" }, nullable: true },
            subject_type: { type: "string" },
            jwks: jwksSchema,
            grant_types: { type: "array", items: { type: "string" } },
            response_types: { type: "array", items: { type: "string" } },
            redirect_uris: { type: "array", items: { type: "string" } },
            client_registration_types: { type: "array", items: { type: "string" } },
          },
          required: [
            "client_name",
            "client_id",
            "application_type",
            "subject_type",
            "jwks",
            "grant_types",
            "response_types",
            "redirect_uris",
            "client_registration_types",
          ],
        },
      },
      required: ["openid_relying_party"],
    },
  },
  required: ["iss", "sub", "iat", "exp", "jwks", "authority_hints", "metadata"],
};
const validateRelyingPartyEntityConfiguration = ajv.compile(relyingPartyEntityConfigurationSchema);

const IdentityProviderEntityConfigurationSchema: JSONSchemaType<IdentityProviderEntityConfiguration> = {
  type: "object",
  properties: {
    iss: { type: "string" },
    sub: { type: "string" },
    iat: { type: "number" },
    exp: { type: "number" },
    jwks: jwksSchema,
    trust_marks: { type: "array" } as any,
    authority_hints: { type: "array", items: { type: "string" } },
    metadata: {
      type: "object",
      properties: {
        openid_provider: {
          type: "object",
        } as any,
      },
      required: ["openid_provider"],
    },
  },
  required: ["iss", "sub", "iat", "exp", "jwks", "authority_hints", "metadata"],
};
const validateIdentityProviderEntityConfiguration = ajv.compile(IdentityProviderEntityConfigurationSchema);

const trustAnchorEntityConfigurationSchema: JSONSchemaType<TrustAnchorEntityConfiguration> = {
  type: "object",
  properties: {
    iss: { type: "string" },
    sub: { type: "string" },
    iat: { type: "number" },
    exp: { type: "number" },
    jwks: jwksSchema,
    metadata: {
      type: "object",
      properties: {
        federation_entity: {
          type: "object",
          properties: {
            name: { type: "string" },
            homepage_uri: { type: "string" },
            contacts: { type: "array", items: { type: "string" } },
            federation_fetch_endpoint: { type: "string" },
            federation_list_endpoint: { type: "string" },
            federation_resolve_endpoint: { type: "string" },
            federation_status_endpoint: { type: "string" },
          },
          required: [
            "name",
            "homepage_uri",
            "federation_fetch_endpoint",
            "federation_list_endpoint",
            "federation_resolve_endpoint",
            "federation_status_endpoint",
          ],
        },
      },
      required: ["federation_entity"],
    },
    trust_marks_issuers: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: { type: "string" },
      },
      required: [],
    },
    constraints: {
      type: "object",
      properties: {
        max_path_length: { type: "number" },
      },
      required: ["max_path_length"],
    },
  },
  required: ["constraints", "exp", "iat", "iss", "jwks", "metadata", "sub", "trust_marks_issuers"],
};
const validateTrustAnchorEntityConfiguration = ajv.compile(trustAnchorEntityConfigurationSchema);
