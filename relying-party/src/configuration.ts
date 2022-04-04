import * as jose from "jose";
import { inferAlgForJWK, isValidURL, readJSON, undiciHttpClient } from "./utils";
import { isEqual, difference, uniq } from "lodash";
import { consoleLogger } from "./default-implementations/consoleLogger";
import { UserInfoCIE, UserInfoSPID } from "./requestUserInfo";
import { AuthenticationRequest } from "./createAuthenticationRequest";

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

  /**
   * Human-readable name of this application
   */
  client_name: string;

  /**
   * urls that identifies trust anchors
   *
   * @example ["https://registry.spid.gov.it/"]
   */
  trust_anchors: Array<string>;

  /**
   * OPTIONAL. JSON array with one or more strings representing contact persons at the entity.
   * These MAY contain names, e-mail addresses, descriptions, phone numbers, etc.
   *
   * See the [relevant specification for OpenID](https://openid.net/specs/openid-connect-federation-1_0.html#rfc.section.4.6).
   */
  contacts?: Array<string>;

  /**
   * urls that identifies identity providers
   * @example {
   *  spid: ["https://spid.ag-pub-full.it/"],
   *  cie: ["https://cie.agid.gov.it/"]
   * }
   */
  identity_providers: Record<IdentityProviderProfile, Array<string>>;

  /**
   * list of urls where the user browser will be redirected
   *
   * At least one redirect uri is required.
   *
   * The first redirect uri will be used for callback enpoint in this implementation
   *
   * @example ["https://my.domain/callback"]
   */
  redirect_uris: Array<string>;

  /**
   * you obtain these during onboarding process, they are needed for security purposes
   *
   * load them from filesystem or database
   */
  trust_marks: Array<TrustMark>;

  /**
   * jwks format of your public keys
   *
   * load them from filesystem or database (do not commit your cryprographic keys)
   *
   * these keys are needed during onboarding process wiht federation and for comunication with provider
   *
   * you can generate them with {@link generateJWKS}
   */
  public_jwks: JWKs;

  /** @see {@link Configuration.public_jwks} */
  private_jwks: JWKs;

  /** what kind of application this relyin party is, for different application types dirreferent rules can appply */
  application_type: "web";

  /** response types supported by this relying party, there can be more in the future */
  response_types: Array<"code">;

  /**
   * the scope of authentication supported by this relying party
   *
   * **openid** is required by default
   *
   * **offline_access** is required t access user info when the user is not using a device
   */
  scope: Array<"openid" | "offline_access">;

  providers: {
    [P in IdentityProviderProfile]: {
      /** what level of authentication is required */
      acr_values: AcrValue;
      /** what information to request about user from provider */
      requestedClaims: {
        id_token: Partial<Record<IdentityProviderProfileClaims[P], { essential: true }>>;
        userinfo: Partial<Record<IdentityProviderProfileClaims[P], null>>;
      };
    };
  };

  /** jwt default expiration in seconds */
  federation_default_exp: number;

  /** supply a storage that will be used to store intermediate stateful data  */
  storage: AsyncStorage<AuthenticationRequest>;

  /**
   * a function that will be called to log detailed events and exceptions
   * @see {@link logRotatingFilesystem} for an example
   */
  logger: AbstractLogging;

  /**
   * a function that will be called to log mandatory details that must be stored for 24 months (such as access_token, refresh_token, id_token)
   * @see {@link auditLogRotatingFilesystem} for an example
   */
  auditLogger(message: object | unknown): void;

  /** a function that will be used to make http request to other parties */
  httpClient: HttpClient;
};

export type TrustMark = { id: string; trust_mark: string };

export type JWKs = { keys: Array<jose.JWK> };

type IdentityProviderProfile = "spid" | "cie";
type IdentityProviderProfileClaims = {
  spid: keyof UserInfoSPID;
  cie: keyof UserInfoCIE;
};

/** level of authentication */
export type AcrValue = typeof AcrValue[keyof typeof AcrValue];
/** level of authentication */
export const AcrValue = {
  l1: "https://www.spid.gov.it/SpidL1",
  l2: "https://www.spid.gov.it/SpidL2",
  l3: "https://www.spid.gov.it/SpidL3",
} as const;

type HttpRequest =
  | { method: "GET"; url: string; headers?: Record<string, string | undefined> }
  | { method: "POST"; url: string; headers?: Record<string, string | undefined>; body: string };
type HttpResponse = { status: number; headers: Record<string, string | undefined>; body: string };
export type HttpClient = (request: HttpRequest) => Promise<HttpResponse>;

export type AsyncStorage<T> = {
  read(rowId: string): Promise<T>;
  write(rowId: string, value: T): Promise<void>;
  delete(rowId: string): Promise<void>;
};

export type LogLevels = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export type AbstractLogging = {
  [K in LogLevels]: (...args: any[]) => void;
};

function defaultAuditLogger(message: any) {
  console.error("Missing audit logger.", message);
}

type MandatoryConfiguration = Pick<
  Configuration,
  "client_id" | "client_name" | "trust_anchors" | "identity_providers" | "logger" | "auditLogger" | "storage"
>;

type AdditionalConfiguration = {
  /**
   * The path (relative to the CWD) where to find the Public JWKs, if not passed
   * directly as `public_jwks`.
   */
  public_jwks_path?: string;

  /**
   * The path (relative to the CWD) where to find the Private JWKs, if not passed
   * directly as `private_jwks`.
   */
  private_jwks_path?: string;

  /**
   * The path (relative to the CWD) where to find the Trust Marks, if not passed
   * directly as `trust_marks`.
   */
  trust_marks_path?: string;
};

export type ConfigurationFacadeOptions = MandatoryConfiguration & Partial<Configuration> & AdditionalConfiguration;

/**
 * This is a configuration facade to minimize setup effort.
 * @see {@link Configuration} fields for further customization
 */
export async function createConfigurationFromConfigurationFacade({
  client_id,
  client_name,
  trust_anchors,
  identity_providers,
  public_jwks,
  public_jwks_path,
  private_jwks,
  private_jwks_path,
  trust_marks,
  trust_marks_path,
  logger = consoleLogger,
  auditLogger = defaultAuditLogger,
  httpClient = undiciHttpClient,
  ...rest
}: ConfigurationFacadeOptions): Promise<Configuration> {
  if (public_jwks != null && public_jwks_path != null) {
    throw new Error(`Cannot use both 'public_jwks' and 'public_jwks_path' in the configuration`);
  } else if (public_jwks_path != null) {
    public_jwks = await readJSON<JWKs>(public_jwks_path);
  }

  if (public_jwks == null) {
    throw new Error(`You need to pass a 'public_jwk' or 'public_jwks_path' configuration`);
  }

  if (private_jwks != null && private_jwks_path != null) {
    throw new Error(`Cannot use both 'private_jwks' and 'private_jwks_path' in the configuration`);
  } else if (private_jwks_path != null) {
    private_jwks = await readJSON<JWKs>(private_jwks_path);
  }

  if (private_jwks == null) {
    throw new Error(`You need to pass a 'private_jwk' or 'private_jwks_path' configuration`);
  }

  if ((public_jwks != null) !== (private_jwks != null)) {
    throw new Error(`You need to pass 'public_jwks' and 'private_jwks' together.`);
  }

  if (trust_marks != null && trust_marks_path != null) {
    throw new Error(`Cannot use both 'trust_marks' and 'trust_marks_path' in the configuration`);
  } else if (trust_marks_path != null) {
    try {
      trust_marks = await readJSON<TrustMark[]>(trust_marks_path);
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        trust_marks = [];
      } else {
        throw new Error(`Could not load trust_marks from ${trust_marks_path}: ${error}`);
      }
    }
  } else if (trust_marks == null) {
    trust_marks = [];
  }

  return {
    client_id,
    client_name,
    trust_anchors,
    identity_providers,

    application_type: "web",
    response_types: ["code"],
    scope: ["openid", "offline_access"],
    providers: {
      spid: {
        acr_values: AcrValue.l2,
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
        acr_values: AcrValue.l2,
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
    public_jwks,
    private_jwks,
    trust_marks,
    redirect_uris: [client_id + "callback"],
    logger,
    auditLogger,
    httpClient,
    ...rest,
  };
}

export async function validateConfiguration(configuration: Configuration) {
  if (!isValidURL(configuration.client_id)) {
    throw new Error(`configuration: client_id must be a valid url ${configuration.client_id}`);
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
  if (configuration.federation_default_exp <= 0) {
    throw new Error(`configuration: federation_default_exp must be > 0`);
  }
  const invalidTrustAnchors = configuration.trust_anchors.filter((url) => !isValidURL(url));
  if (invalidTrustAnchors.length > 0) {
    throw new Error(`configuration: trust_anchors must be a list of valid urls ${JSON.stringify(invalidTrustAnchors)}`);
  }
  for (const providerType of ["cie", "spid"] as const) {
    const invalidProviders = configuration.identity_providers[providerType].filter(
      (url) => !isValidURL(url) && url.endsWith("/")
    );
    if (invalidProviders.length > 0) {
      throw new Error(
        `configuration: identity_providers must be a list of valid urls ${JSON.stringify(invalidProviders)}`
      );
    }
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

  if (typeof configuration.logger !== "object") {
    throw new Error(`configuration: logger must be an object conforming to the Abstract Logging interface`);
  }

  if (typeof configuration.auditLogger !== "function") {
    throw new Error(`configuration: auditLogger must be a function`);
  }
}
