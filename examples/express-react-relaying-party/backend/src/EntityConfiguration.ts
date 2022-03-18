import { Configuration } from "./Configuration";
import { makeIat } from "./uils";

export function EntityConfiguration(
  configuration: Configuration
) {
  const iat = makeIat();
  const exp = iat + configuration.federationDefaultExp;
  const iss = configuration.sub;
  const sub = configuration.sub;
  // parent authority
  // TODO check if it is correct
  const authority_hints = configuration.trustAnchors;
  // oidc core public keys
  // TODO use separate keys for core and federation
  const core_jwks = { keys: configuration.publicJWKS };
  // oidc federation public keys
  // use these for federation related operations such as onboarding
  // TODO use separate keys for core and federation
  const federation_jwks = { keys: configuration.publicJWKS };
  // you obtain this fron federation during onbaording process (after relaying party is validated)
  const trust_marks = configuration.trustMarks;
  const client_name = configuration.application_name;
  const { application_type, contacts, redirect_uris, response_types } =
    configuration;
  return {
    iat,
    exp,
    iss,
    sub,
    jwks: core_jwks,
    metadata: {
      openid_relying_party: {
        application_type,
        client_id: sub,
        client_registration_types: ["automatic"],
        jwks: federation_jwks,
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
