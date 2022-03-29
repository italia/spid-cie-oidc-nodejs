import { Configuration } from "./Configuration";
import { makeExp, makeIat } from "./utils";
import * as jose from "jose";

export function EntityConfiguration(
  configuration: Configuration
): RelyingPartyEntityConfiguration {
  const iat = makeIat();
  const exp = makeExp(configuration.federation_default_exp);
  const iss = configuration.client_id;
  const sub = configuration.client_id;
  const client_id = configuration.client_id;
  const authority_hints = configuration.trust_anchors;
  // TODO use separate keys for core and federation
  // use federation public jwks for federation related operations such as onboarding
  const jwks = configuration.public_jwks;
  // you obtain this fron federation during onbaording process (after relaying party is validated)
  const trust_marks = configuration.trust_marks;
  const client_name = configuration.client_name;
  const application_type = configuration.application_type;
  const contacts = configuration.contacts;
  const redirect_uris = configuration.redirect_uris;
  const response_types = configuration.response_types;
  return {
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
      contacts: Array<string>;
      grant_types: Array<string>;
      redirect_uris: Array<string>;
      response_types: Array<string>;
      subject_type: string;
    };
  };
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
    openid_provider: {
      authorization_endpoint: string;
      revocation_endpoint: string;
      id_token_encryption_alg_values_supported: Array<string>;
      id_token_encryption_enc_values_supported: Array<string>;
      op_name: string;
      op_uri: string;
      token_endpoint: string;
      userinfo_endpoint: string;
      introspection_endpoint: string;
      claims_parameter_supported: boolean;
      contacts: Array<string>;
      client_registration_types_supported: Array<string>;
      code_challenge_methods_supported: Array<string>;
      request_authentication_methods_supported: unknown; // TODO
      acr_values_supported: Array<string>;
      claims_supported: Array<string>;
      grant_types_supported: Array<string>;
      id_token_signing_alg_values_supported: Array<string>;
      issuer: string;
      jwks: { keys: Array<jose.JWK> };
      scopes_supported: Array<string>;
      logo_uri: string;
      organization_name: string;
      op_policy_uri: string;
      request_parameter_supported: boolean;
      request_uri_parameter_supported: boolean;
      require_request_uri_registration: boolean;
      response_types_supported: Array<string>;
      subject_types_supported: Array<string>;
      token_endpoint_auth_methods_supported: Array<string>;
      token_endpoint_auth_signing_alg_values_supported: Array<string>;
      userinfo_encryption_alg_values_supported: Array<string>;
      userinfo_encryption_enc_values_supported: Array<string>;
      userinfo_signing_alg_values_supported: Array<string>;
      request_object_encryption_alg_values_supported: Array<string>;
      request_object_encryption_enc_values_supported: Array<string>;
      request_object_signing_alg_values_supported: Array<string>;
    };
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
