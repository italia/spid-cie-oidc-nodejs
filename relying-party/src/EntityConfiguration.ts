import { Configuration } from "./Configuration";
import { createJWS, makeExp, makeIat } from "./utils";
import * as jose from "jose";

export async function EntityConfiguration(configuration: Configuration) {
  const iat = makeIat();
  const exp = makeExp(configuration.federation_default_exp);
  const iss = configuration.client_id;
  const sub = configuration.client_id;
  const client_id = configuration.client_id;
  const authority_hints = configuration.trust_anchors;
  // SHOULDDO use separate keys for core and federation
  // use federation public jwks for federation related operations such as onboarding
  const jwks = configuration.public_jwks;
  const trust_marks = configuration.trust_marks;
  const client_name = configuration.client_name;
  const application_type = configuration.application_type;
  const contacts = configuration.contacts;
  const redirect_uris = configuration.redirect_uris;
  const response_types = configuration.response_types;
  const entity_configuration: RelyingPartyEntityConfiguration = {
    iat,
    exp,
    iss,
    sub,
    jwks,
    metadata: {
      openid_relying_party: {
        application_type,
        client_id,
        client_registration_types: ["automatic"],
        jwks,
        client_name,
        contacts,
        grant_types: ["refresh_token", "authorization_code"],
        redirect_uris,
        response_types,
        subject_type: "pairwise",
      },
    },
    trust_marks,
    authority_hints,
  };
  const jwk = configuration.private_jwks.keys[0]; // SHOULDDO make it configurable
  const jws = await createJWS(entity_configuration, jwk);
  return jws;
}

export type RelyingPartyEntityConfiguration = {
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  jwks: { keys: Array<jose.JWK> };
  trust_marks: Array<{ id: string; trust_mark: string }>;
  authority_hints: Array<string>;
  metadata: {
    openid_relying_party: {
      application_type: string;
      client_id: string;
      client_registration_types: Array<string>;
      jwks: { keys: Array<jose.JWK> };
      client_name: string;
      contacts?: Array<string>;
      grant_types: Array<string>;
      redirect_uris: Array<string>;
      response_types: Array<string>;
      subject_type: string;
    };
  };
};

type Translatable<Key extends string, Type = string> = {
  [K in Key]: Type;
} & {
  [L in string as `${Key}#${L}`]: Type;
};

/**
 * Il formato del metadata deriva da quanto specificato nel documento «OpenID
 * Connect Discovery 1.0», del quale costituisce un sottoinsieme con alcuni
 * campi in aggiunta.
 *
 * https://docs.italia.it/AgID/documenti-in-consultazione/lg-openidconnect-spid-docs/it/bozza/metadata/openid-provider-op-metadata.html
 * 
 * https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
 */
export type OpenIDProviderMetadata = Translatable<"op_name" | "op_uri" | "op_url"> & {
  acr_values_supported: Array<string>;
  authorization_endpoint: string;
  claims_parameter_supported: boolean;
  claims_supported: Array<string>;
  client_registration_types_supported: Array<string>;
  code_challenge_methods_supported: Array<string>;
  contacts: Array<string>;
  grant_types_supported: Array<string>;

  /** OPTIONAL. JSON array containing a list of the JWE encryption algorithms (alg values) supported by the OP for the ID Token to encode the Claims in a JWT. */
  id_token_encryption_alg_values_supported?: Array<string>;

  /** OPTIONAL. JSON array containing a list of the JWE encryption algorithms (enc values) supported by the OP for the ID Token to encode the Claims in a JWT. */
  id_token_encryption_enc_values_supported?: Array<string>;
  id_token_signing_alg_values_supported: Array<string>;
  introspection_endpoint: string;
  issuer: string;
  jwks: { keys: Array<jose.JWK> };
  logo_uri: string;
  op_name: string;
  op_policy_uri: string;
  op_uri: string;
  organization_name: string;
  request_authentication_methods_supported: unknown; // SHOULDDO
  request_object_encryption_alg_values_supported: Array<string>;
  request_object_encryption_enc_values_supported: Array<string>;
  request_object_signing_alg_values_supported: Array<string>;
  request_parameter_supported: boolean;
  request_uri_parameter_supported: boolean;
  require_request_uri_registration: boolean;
  response_types_supported: Array<string>;
  revocation_endpoint: string;
  scopes_supported: Array<string>;
  subject_types_supported: Array<string>;
  token_endpoint_auth_methods_supported: Array<string>;
  token_endpoint_auth_signing_alg_values_supported: Array<string>;
  token_endpoint: string;
  userinfo_encryption_alg_values_supported: Array<string>;
  userinfo_encryption_enc_values_supported: Array<string>;
  userinfo_endpoint: string;
  userinfo_signing_alg_values_supported: Array<string>;
};

export type IdentityProviderEntityConfiguration = {
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  jwks: { keys: Array<jose.JWK> };
  trust_marks: Array<{ id: string; trust_mark: string }>;
  authority_hints: Array<string>;
  metadata: {
    openid_provider: OpenIDProviderMetadata;
  };
};

export type TrustAnchorEntityConfiguration = {
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  jwks: { keys: Array<jose.JWK> };
  metadata: {
    federation_entity: {
      contacts: Array<string>;
      federation_fetch_endpoint: string;
      federation_resolve_endpoint: string;
      federation_status_endpoint: string;
      homepage_uri: string;
      name: string;
      federation_list_endpoint: string;
    };
  };
  trust_marks_issuers: Record<string, Array<string>>;
  constraints: { max_path_length: number };
};
