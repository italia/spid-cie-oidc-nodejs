import { Configuration } from "./Configuration";
import { auditLogRotatingFilesystem } from "./default-implementations/auditLogRotatingFilesystem";
import { deriveFiscalNumberUserIdentifier } from "./default-implementations/deriveFiscalNumberUserIdentifier";
import { loadOrCreateJWKSFromFilesystem } from "./default-implementations/loadOrCreateJWKSFromFilesystem";
import { loadTrustMarksFromFilesystem } from "./default-implementations/loadTrustMarksFromFilesystem";
import { logRotatingFilesystem } from "./default-implementations/logRotatingFilesystem";

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
}: Pick<
  Configuration,
  "client_id" | "client_name" | "contacts" | "trust_anchors" | "identity_providers"
>): Promise<Configuration> {
  const { public_jwks, private_jwks } = await loadOrCreateJWKSFromFilesystem();
  const trust_marks = await loadTrustMarksFromFilesystem();
  const logger = logRotatingFilesystem;
  const auditLogger = auditLogRotatingFilesystem;
  const deriveUserIdentifier = deriveFiscalNumberUserIdentifier;
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
    redirect_uris: [client_id + "callback"],
    deriveUserIdentifier,
    logger,
    auditLogger,
  };
}
