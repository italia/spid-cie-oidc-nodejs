import * as jose from "jose";
import { inferAlgForJWK, isValidEmail, isValidURL, LogLevel } from "./utils";
import { isEqual, difference, uniq } from "lodash";
import { UserInfo } from "./UserInfoRequest";

/**
 * This configuration must be done on the relying party side
 *
 * see field descriptions to understand how to customize relying party
 */
export type Configuration = {
  /**
   * Url that identifies this relying party.
   * The relying party must be reachable on this url from outside
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
      requestedClaims: Record<string, null | { essential: true }>;
    }
  >;
  /** jwt default expiration in seconds */
  federation_default_exp: number;
  /** this function will be used to derive a user unique identifier from claims */
  deriveUserIdentifier(user_info: UserInfo): string;
  /**
   * a function that will be called to log detailed events and exceptions
   * @see {@link logRotatingFilesystem} for an example
   */
  logger(level: LogLevel, message: Error | string | object | unknown): void;
  /**
   * a function that will be called to log mandatory details that must be stored for 24 months (such as access_token, refresh_token, id_token)
   * @see {@link auditLogRotatingFilesystem} for an example
   */
  auditLogger(message: object | unknown): void;
};

export async function validateConfiguration(configuration: Configuration) {
  if (!isValidURL(configuration.client_id)) {
    throw new Error(`configuration: client_id must be a valid url ${configuration.client_id}`);
  }
  for (const email of configuration.contacts) {
    if (!isValidEmail(email)) {
      throw new Error(`configuration: contacts must be alist of valid emails ${email}`);
    }
  }
  if (configuration.application_type !== "web") {
    throw new Error(`configuration: application_type must be "web"`);
  }
  if (!isEqual(configuration.response_types, ["code"])) {
    throw new Error(`configuration: response_types must be ["code"]`);
  }
  const supportedScope = ["openid", "offline_access"];
  const scopeDiff = difference(configuration.scope, supportedScope);
  if (scopeDiff.length > 0) {
    throw new Error(`configuration: scope must be subset of ${JSON.stringify(supportedScope)}`);
  }
  if (uniq(configuration.scope).length !== configuration.scope.length) {
    throw new Error(`configuration: scope must not contain duplicates ${JSON.stringify(configuration.scope)}`);
  }
  if (!isEqual(configuration.token_endpoint_auth_method, ["private_key_jwt"])) {
    throw new Error(`configuration: token_endpoint_auth_method must be ["private_key_jwt"]`);
  }
  if (configuration.federation_default_exp <= 0) {
    throw new Error(`configuration: federation_default_exp must be > 0`);
  }
  const invalidTrustAnchors = configuration.trust_anchors.filter((url) => !isValidURL(url));
  if (invalidTrustAnchors.length > 0) {
    throw new Error(`configuration: trust_anchors must be a list of valid urls ${JSON.stringify(invalidTrustAnchors)}`);
  }
  const invalidProviders = configuration.identity_providers.filter((url) => !isValidURL(url));
  if (invalidProviders.length > 0) {
    throw new Error(
      `configuration: identity_providers must be a list of valid urls ${JSON.stringify(invalidProviders)}`
    );
  }
  if (configuration.redirect_uris.length < 1) {
    throw new Error(`configuration: redirect_uris must be at least one`);
  }
  const invalidRedirectUris = configuration.redirect_uris.filter((url) => !isValidURL(url));
  if (invalidRedirectUris.length > 0) {
    throw new Error(`configuration: redirect_uris must be a list of valid urls ${JSON.stringify(invalidRedirectUris)}`);
  }
  if (configuration.public_jwks.keys.length < 1) {
    throw new Error(`configuration: public_jwks must be at least one`);
  }
  if (configuration.private_jwks.keys.length !== configuration.public_jwks.keys.length) {
    throw new Error(`configuration: public_jwks and private_jwks must have the same length`);
  }
  for (const public_jwk of configuration.public_jwks.keys) {
    try {
      await jose.importJWK(public_jwk, inferAlgForJWK(public_jwk));
    } catch (error) {
      throw new Error(`configuration: public_jwks must be a list of valid jwks ${JSON.stringify(public_jwk)}`);
    }
  }
  for (const private_jwk of configuration.private_jwks.keys) {
    try {
      await jose.importJWK(private_jwk, inferAlgForJWK(private_jwk));
    } catch (error) {
      throw new Error(`configuration: private_jwks must be a list of valid jwks ${JSON.stringify(private_jwk)}`);
    }
  }
  for (const public_jwk of configuration.public_jwks.keys) {
    if (!public_jwk.kid) {
      throw new Error(`configuration: public_jwks must have a kid ${JSON.stringify(public_jwk)}`);
    }
    if (!configuration.private_jwks.keys.some((private_jwk) => private_jwk.kid === public_jwk.kid)) {
      throw new Error(
        `configuration: public_jwks and private_jwks must have mtching kid ${JSON.stringify(public_jwk)}`
      );
    }
  }
  if (typeof configuration.logger !== "function") {
    throw new Error(`configuration: logger must be a function`);
  }
  if (typeof configuration.auditLogger !== "function") {
    throw new Error(`configuration: auditLogger must be a function`);
  }
}
