import * as fs from "fs";
import { generateJWKS } from "./utils";
import { Configuration } from "./Configuration";

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
}: {
  client_id: string;
  client_name: string;
  contacts: Array<string>;
  trust_anchors: Array<string>;
  identity_providers: Array<string>;
}): Promise<Configuration> {
  const { public_jwks, private_jwks } = await loadOrCreateJWKS();
  const trust_marks = await loadTrustMarks();
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
    deriveUserIdentifier(claims) {
      const userIdentifierFields = ["https://attributes.spid.gov.it/fiscalNumber", "fiscalNumber"];
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

async function loadOrCreateJWKS() {
  const public_jwks_path = "./public.jwks.json";
  const private_jwks_path = "./private.jwks.json";
  if ((await fileExists(public_jwks_path)) && (await fileExists(private_jwks_path))) {
    const public_jwks = JSON.parse(await fs.promises.readFile(public_jwks_path, "utf8"));
    const private_jwks = JSON.parse(await fs.promises.readFile(private_jwks_path, "utf8"));
    return { public_jwks, private_jwks };
  } else {
    const { public_jwks, private_jwks } = await generateJWKS();
    await fs.promises.writeFile(public_jwks_path, JSON.stringify(public_jwks));
    await fs.promises.writeFile(private_jwks_path, JSON.stringify(private_jwks));
    return { public_jwks, private_jwks };
  }
}

async function loadTrustMarks() {
  const trust_marks_path = "./trust_marks.json";
  if (await fileExists(trust_marks_path)) return JSON.parse(await fs.promises.readFile(trust_marks_path, "utf8"));
  else return [];
}

async function fileExists(path: string) {
  try {
    await fs.promises.stat(path);
    return true;
  } catch (error) {
    return false;
  }
}
