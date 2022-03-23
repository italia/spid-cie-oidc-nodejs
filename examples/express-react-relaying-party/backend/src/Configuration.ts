import * as jose from "jose";
import { REPLACEME_CALLBACK_ROUTE } from "./ExpressRouter";
import { Request, Response } from "express";

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
  trust_marks: Array<{ id: string; trust_mark: string }>;
  public_jwks: { keys: Array<jose.JWK> };
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
  callbacks: Callbacks;
  /** this function will be used to derive a user unique identifier from claims */
  deriveUserIdentifier(user_info: unknown): string; // TODO better types for claims
};

type Callbacks = {
  /** this callback will be called when some error occurs during authorization */
  onError(
    req: Request,
    res: Response,
    error: string,
    error_description?: string
  ): void;
  /** this callback will be called when user_info is succesfully acquired */
  onLogin(
    req: Request,
    res: Response,
    /** is an opaque value, most often an json structure */
    user_info: unknown
  ): void;
  /** this callback will be called when user logs out */
  onLogout(req: Request, res: Response): void;
};

export function validateRelayingPartyConfiguration(
  configuration: Configuration
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
  // TODO check redirect uris are correct urls and at least one
  // TODO check arrays and space separated strings does not contain duplicates
}

export function makeDefaultConfiguration({
  client_id,
  client_name,
  contacts,
  trust_anchors,
  identity_providers,
  public_jwks,
  private_jwks,
  trust_marks,
  callbacks,
}: {
  client_id: string;
  client_name: string;
  contacts: Array<string>;
  trust_anchors: Array<string>;
  identity_providers: Array<string>;
  public_jwks: { keys: Array<jose.JWK> };
  private_jwks: { keys: Array<jose.JWK> };
  trust_marks: Array<{ id: string; trust_mark: string }>;
  callbacks: Callbacks;
}): Configuration {
  return {
    client_id,
    client_name,
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
    federation_default_exp: 48 * 60 * 60,
    trust_anchors,
    identity_providers,
    public_jwks,
    private_jwks,
    trust_marks,
    redirect_uris: [client_id + REPLACEME_CALLBACK_ROUTE],
    callbacks,
    deriveUserIdentifier(claims) {
      const userIdentifierFields = [
        "https://attributes.spid.gov.it/fiscalNumber",
        "fiscalNumber",
      ];
      if (!(typeof claims === "object" && claims !== null)) throw new Error();
      const claimsAsRecord = claims as Record<string, unknown>;
      for (const userIdentifierField of userIdentifierFields) {
        const value = claimsAsRecord[userIdentifierField];
        if (typeof value === "string") return value;
      }
      throw new Error();
    },
  };
}
