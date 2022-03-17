import { RelayingPartyConfiguration } from "./RelayingPartyConfiguration";
import { REPLACEME_CALLBACK_ROUTE } from "./RelayingPartyExpressRouter";

export function RelayingPartyEntityConfiguration(
  configuration: RelayingPartyConfiguration
) {
  const iat = Date.now();
  const exp = iat + configuration.federationDefaultExp;
  const iss = configuration.sub;
  const sub = configuration.sub;
  // parent authority
  const authority_hints = configuration.trustAnchors;
  // oidc core public keys
  // TODO use separate keys for core and federation
  const core_jwks = { keys: configuration.publicJWKS };
  // oidc federation public keys
  // use these for federation related operations such as onboarding
  // TODO use separate keys for core and federation
  const federation_jwks = { keys: configuration.publicJWKS };
  // you obtain this fron federation during onbaording process (after relaying party is validated)
  // TODO let it paste
  const trust_marks = [] as any;
  return {
    iat,
    exp,
    iss,
    sub,
    jwks: core_jwks,
    metadata: {
      openid_relying_party: {
        application_type: configuration.application_type,
        client_id: configuration.sub,
        client_registration_types: ["automatic"],
        jwks: federation_jwks,
        client_name: configuration.application_name,
        contacts: configuration.contacts,
        grant_types: ["refresh_token", "authorization_code"],
        redirect_uris: [configuration.sub + REPLACEME_CALLBACK_ROUTE],
        response_types: configuration.response_types,
        subject_type: "pairwise",
      },
    },
    trust_marks,
    authority_hints,
  };
}
