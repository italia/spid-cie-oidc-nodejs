import * as jose from "jose";

// this configuration must be done on the relaying party side
export type Configuration = {
  /**
   * Url that identifies this relaying party.
   * The relaying party must be reachable on this url from outside
   */
  client_id: string;
  /** himan readable name of this application */
  client_name: string;
  /**
   * urls that identifies trust anchors
   *
   * @example ["https://registry.spid.gov.it/"]
   */
  /** emails */
  contacts: Array<string>;
  trust_anchors: Array<string>;
  /**
   * urls that identifies identity providers
   * @example ["https://spid.ag-pub-full.it/"]
   */
  identity_providers: Array<string>;
  redirect_uris: Array<string>;
  /**
   * you obtain these during onboarding process, they are needed for security purposes
   * 
   * load them from filesystem or database
   */
  trust_marks: Array<{ id: string; trust_mark: string }>;
  /**
   * jwks format of your public keys
   * 
   * load them from filesystem or database (do not commit your cryprographic keys)
   * 
   * these keys are needed during onboarding process wiht federation and for comunication with provider
   * 
   * you can generate them with {@link generateJWKS}
   */
  public_jwks: { keys: Array<jose.JWK> };
  /** @see {@link Configuration.public_jwks} */
  private_jwks: { keys: Array<jose.JWK> };
  application_type: "web";
  response_types: Array<"code">;
  scope: Array<"openid" | "offline_access">;
  token_endpoint_auth_method: Array<"private_key_jwt">;
  providers: Record<
    string,
    {
      profile: {}; // TODO
      /** what information to request about user from provider */
      requestedClaims: unknown;
    }
  >;
  /** jwt default expiration in seconds */
  federation_default_exp: number;
  /** this function will be used to derive a user unique identifier from claims */
  deriveUserIdentifier(user_info: unknown): string; // TODO better types for claims
};

export function validateRelayingPartyConfiguration(configuration: Configuration) {
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
  // TODO check redirect uris are correct urls and at least one
  // TODO check arrays and space separated strings does not contain duplicates
}
