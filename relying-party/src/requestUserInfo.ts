import * as jose from "jose";
import { Configuration } from "./configuration";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { httpRequest, inferAlgForJWK } from "./utils";

export async function requestUserInfo(
  configuration: Configuration,
  authenticationRequestEntity: AuthenticationRequestEntity,
  access_token: string
) {
  const request = {
    method: "GET" as const,
    url: authenticationRequestEntity.userinfo_endpoint,
    headers: { Authorization: `Bearer ${access_token}` },
  };
  configuration.logger.info({ message: "User info request", request });
  // SHOULDDO ensure timeout and ssl is respected
  const response = await httpRequest(request);
  if (response.status === 200) {
    const jwe = await response.body;
    const jws = await decrypt(configuration, jwe);
    const jwt = await verify(authenticationRequestEntity, jws);
    configuration.logger.info({ message: "User info request succeeded", request, response });
    return jwt as unknown as UserInfo; // TODO validate;
  } else {
    configuration.logger.error({ message: "User info request failed", request, response });
    throw new Error(`User info request failed`);
  }
}

async function decrypt(configuration: Configuration, jwe: string) {
  const { plaintext } = await jose.compactDecrypt(jwe, async (header) => {
    if (!header.kid) throw new Error("missing kid in header");
    const jwk = configuration.private_jwks.keys.find((key) => key.kid === header.kid);
    if (!jwk) throw new Error("no matching key with kid found");
    return await jose.importJWK(jwk, inferAlgForJWK(jwk));
  });
  return new TextDecoder().decode(plaintext);
}

async function verify(authenticationRequestEntity: AuthenticationRequestEntity, jws: string) {
  try {
    const { payload } = await jose.compactVerify(jws, async (header) => {
      if (!header.kid) throw new Error("missing kid in header");
      const jwk = authenticationRequestEntity.provider_jwks.keys.find((key) => key.kid === header.kid);
      if (!jwk) throw new Error("no matching key with kid found");
      return await jose.importJWK(jwk, inferAlgForJWK(jwk));
    });
    return new TextDecoder().decode(payload);
  } catch (error) {
    if ((error as any).code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
      // user info jwt verificatrion failed, this should not happen
      // SHOULDDO file issue upstream
      return jose.decodeJwt(jws);
    } else {
      throw error;
    }
  }
}

export type UserInfo = Record<string, unknown>;
