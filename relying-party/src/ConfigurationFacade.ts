import { Configuration, JWKs, TrustMark } from "./Configuration";
import { auditLogRotatingFilesystem } from "./default-implementations/auditLogRotatingFilesystem";
import { deriveFiscalNumberUserIdentifier } from "./default-implementations/deriveFiscalNumberUserIdentifier";
import { loadOrCreateJWKSFromFilesystem } from "./default-implementations/loadOrCreateJWKSFromFilesystem";
import { loadTrustMarksFromFilesystem } from "./default-implementations/loadTrustMarksFromFilesystem";
import { logRotatingFilesystem } from "./default-implementations/logRotatingFilesystem";
import { readJSON } from "./utils";

type MandatoryConfiguration = Pick<
  Configuration,
  "client_id" | "client_name" | "contacts" | "trust_anchors" | "identity_providers"
>;

type AdditionalConfiguration = {
  public_jwks_path?: string;
  private_jwks_path?: string;
  trust_marks_path?: string;
};

export type ConfigurationFacadeOptions = MandatoryConfiguration & Partial<Configuration> & AdditionalConfiguration;

/**
 * This is a configuration facade to minimize setup effort.
 * @see {@link Configuration} fields for further customization
 */
export async function ConfigurationFacade({
  client_id,
  client_name,
  contacts,
  trust_anchors,
  identity_providers,
  public_jwks,
  public_jwks_path,
  private_jwks,
  private_jwks_path,
  trust_marks,
  trust_marks_path,
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
    trust_marks = await readJSON<TrustMark[]>(trust_marks_path);
  } else if (trust_marks == null) {
    trust_marks = [];
  }

  const logger = logRotatingFilesystem;
  const auditLogger = auditLogRotatingFilesystem;
  const deriveUserIdentifier = deriveFiscalNumberUserIdentifier;

  return {
    client_id,
    client_name,
    contacts,
    trust_anchors,
    identity_providers,

    application_type: "web",
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
    public_jwks,
    private_jwks,
    trust_marks,
    redirect_uris: [
      // TODO This should be configurable
      client_id + "callback",
    ],
    deriveUserIdentifier,
    logger,
    auditLogger,
    ...rest,
  };
}