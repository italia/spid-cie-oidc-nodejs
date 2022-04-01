import { request } from "undici";
import * as jose from "jose";
import { inferAlgForJWK, makeIat } from "./utils";
import {
  TrustAnchorEntityConfiguration,
  IdentityProviderEntityConfiguration,
  RelyingPartyEntityConfiguration,
} from "./EntityConfiguration";
import { cloneDeep, difference, intersection } from "lodash";
import { Configuration } from "./Configuration";

// SHOULDDO implement arbitray length tst chain validation
// SHOULDDO check authority hints
async function TrustChain(
  configuration: Configuration,
  relying_party: string,
  identity_provider: string,
  trust_anchor: string
) {
  const relying_party_entity_configuration = await getEntityConfiguration<RelyingPartyEntityConfiguration>(
    relying_party
  );
  const identity_provider_entity_configuration = await getEntityConfiguration<IdentityProviderEntityConfiguration>(
    identity_provider
  );
  const trust_anchor_entity_configuration = await getEntityConfiguration<TrustAnchorEntityConfiguration>(trust_anchor);
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
  const response = await request(
    `${superior.metadata.federation_entity.federation_fetch_endpoint}?sub=${descendant.sub}`,
    {
      method: "GET",
    }
  );
  if (response.statusCode !== 200) {
    throw new Error(); // TODO better error reporting
  }
  if (!response.headers["content-type"]?.startsWith("application/entity-statement+jwt")) {
    throw new Error(); // TODO better error reporting
  }
  const jws = await response.body.text();
  const { payload } = await jose.compactVerify(jws, async (header) => {
    if (!header.kid) throw new Error("missing kid in header"); // TODO better error report
    const jwk = superior.jwks.keys.find((key: any) => key.kid === header.kid);
    if (!jwk) throw new Error("no matching key with kid found"); // TODO better error report
    return await jose.importJWK(jwk, inferAlgForJWK(jwk));
  });
  // TODO validate
  return JSON.parse(new TextDecoder().decode(payload));
}

// SHOULDDO memoize by expiration
async function getEntityConfiguration<T>(url: string): Promise<T> {
  // TODO when doing post request ensure timeout and ssl is respected
  const response = await request(url + ".well-known/openid-federation", {
    method: "GET",
  });
  if (response.statusCode !== 200) {
    throw new Error(); // TODO better error reporting
  }
  if (!response.headers["content-type"]?.startsWith("application/entity-statement+jwt")) {
    throw new Error(); // TODO better error reporting
  }
  const jws = await response.body.text();
  const entity_configuration = verifyEntityConfiguration(jws);
  return entity_configuration;
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

// TODO
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

export async function verifyEntityConfiguration(jws: string) {
  const decoded: any = jose.decodeJwt(jws);
  const { payload } = await jose.compactVerify(jws, async (header) => {
    if (!header.kid) throw new Error("missing kid in header"); // TODO better error report
    const jwk = decoded.jwks.keys.find((key: any) => key.kid === header.kid);
    if (!jwk) throw new Error("no matching key with kid found"); // TODO better error report
    return await jose.importJWK(jwk, inferAlgForJWK(jwk));
  });
  const entity_configuration = JSON.parse(new TextDecoder().decode(payload));
  // TODO verify schema (verify that has trust_marks)
  return entity_configuration;
}

const trustChainCache = new Map<string, Awaited<ReturnType<typeof TrustChain>>>();
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
    const trust_chain = await TrustChain(configuration, relying_party, identity_provider, trust_anchor);
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
            return CachedTrustChain(configuration, configuration.client_id, provider, trust_anchor);
          } catch (error) {
            configuration.logger.warn(error);
            return null;
          }
        })
      )
    ).find((trust_chain) => trust_chain !== null) ?? null;
  return identityProviderTrustChain;
}
