import * as jose from "jose";

// this configuration must be done on the relaying party side
export type RelayingPartyConfiguration = {
  /**
   * Url that identifies this relaying party.
   * The relaying party must be reachable on this url from outside
   */
  sub: string;
  /**
   * urls that identifies trust anchors
   *
   * @example ["https://registry.spid.gov.it/"]
   */
  trustAnchors: Array<string>;
  /**
   * urls that identifies identity providers
   * @example ["https://spid.ag-pub-full.it/"]
   */
  identityProviders: Array<string>;
  publicJWKS: Array<jose.JWK>;
  privateJWKS: Array<jose.JWK>;
  application_name: string;
  application_type: "web";
  /** emails */
  contacts: Array<string>;
  response_types: Array<"code">;
  scope: Array<"openid" | "offline_access">;
  token_endpoint_auth_method: ["private_key_jwt"];
  providers: Record<
    string,
    {
      profile: {}; // TODO
      /** what information to request about user from provider */
      requestedClaims: unknown;
    }
  >;
  /** which user attribute will be used to link to a preexisting account */
  userLookupField: string;
  /** which user attribute will be used to link to a preexisting account */
  userCreate: boolean;
  /** jwt default expiration in milliseconds */
  federationDefaultExp: number;
};

export function validateRelayingPartyConfiguration(
  configuration: RelayingPartyConfiguration
) {
  // TODO validate configuration for better developer experience
  // TODO sub is valid url
  // TODO contacts are emails
  // TODO application_type is supported (web for now)
  // TODO response_types are supported (code for now)
  // TODO scope is supported (openid and offline_access for now)
  // TODO token_endpoint_auth_method is supported (private_key_jwt for now)
  // TODO federationDefaultExp > 0
  // TODO trustAnchors are valid urls
  // TODO identityProviders are valid urls
  // TODO public and private jwks have matching kids, and are valid jwks, that there is at least one jwk
}

export function makeDefaultRelayingPartyConfiguration({
  sub,
  application_name,
  contacts,
  trustAnchors,
  identityProviders,
  publicJWK,
  privateJWK,
}: {
  application_name: string;
  contacts: Array<string>;
  sub: string;
  trustAnchors: Array<string>;
  identityProviders: Array<string>;
  publicJWK: jose.JWK;
  privateJWK: jose.JWK;
}): RelayingPartyConfiguration {
  return {
    sub,
    application_name,
    application_type: "web",
    contacts,
    response_types: ["code"],
    scope: ["openid", "offline_access"],
    token_endpoint_auth_method: ["private_key_jwt"],
    providers: {
      spid: {
        profile: {
          // "authorization_request": {"acr_values": AcrValuesSpid.l2.value}, // TODO
          // "rp_metadata": RPMetadataSpid, // TODO
          // "authn_response": AuthenticationResponse, // TODO
          // "token_response": TokenResponse // TODO
        },
        requestedClaims: {
          id_token: {
            "https://attributes.spid.gov.it/familyName": { essential: true },
            "https://attributes.spid.gov.it/email": { essential: true },
          },
          userinfo: {
            "https://attributes.spid.gov.it/name": null,
            "https://attributes.spid.gov.it/familyName": null,
            "https://attributes.spid.gov.it/email": null,
            "https://attributes.spid.gov.it/fiscalNumber": null,
          },
        },
      },
      cie: {
        profile: {
          // "authorization_request": {"acr_values": AcrValuesCie.l2.value}, // TODO
          // "rp_metadata": RPMetadataCie, // TODO
          // "authn_response": AuthenticationResponseCie, // TODO
          // "token_response": TokenResponse // TODO
        },
        requestedClaims: {
          id_token: {
            family_name: { essential: true },
            email: { essential: true },
          },
          userinfo: {
            given_name: null,
            family_name: null,
            email: null,
          },
        },
      },
    },
    userLookupField: "fiscal_number",
    userCreate: true,
    federationDefaultExp: 48 * 60 * 60 * 1000,
    trustAnchors,
    identityProviders,
    publicJWKS: [publicJWK],
    privateJWKS: [privateJWK],
  };
}
