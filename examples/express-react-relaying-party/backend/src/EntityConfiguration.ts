import { Configuration } from "./Configuration";
import { makeIat } from "./utils";

export function EntityConfiguration(configuration: Configuration) {
  const iat = makeIat();
  const exp = iat + configuration.federation_default_exp;
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
