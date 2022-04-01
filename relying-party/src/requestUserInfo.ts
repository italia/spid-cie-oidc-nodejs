import * as jose from "jose";
import { request } from "undici";
import { Configuration } from "./configuration";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { inferAlgForJWK } from "./utils";

export async function requestUserInfo(
  configuration: Configuration,
  authenticationRequestEntity: AuthenticationRequestEntity,
  access_token: string
) {
  // SHOULDDO ensure timeout and ssl is used when doing get request
  const url = authenticationRequestEntity.userinfo_endpoint;
  configuration.logger.info({
    url,
    method: "GET",
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const response = await request(url, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const bodyText = await response.body.text();
  if (response.statusCode !== 200) {
    configuration.logger.error({
      statusCode: response.statusCode,
      headers: response.headers,
      body: bodyText,
    });
    throw new Error(`user info request failed`);
  } else {
    configuration.logger.info({
      statusCode: response.statusCode,
      headers: response.headers,
      body: bodyText,
    });
  }
  const jwe = await bodyText;
  const jws = await decrypt(configuration, jwe);
  const jwt = await verify(authenticationRequestEntity, jws);
  return jwt as unknown as UserInfo; // TODO validate;
}

async function decrypt(configuration: Configuration, jwe: string) {
  const { plaintext } = await jose.compactDecrypt(jwe, async (header) => {
    if (!header.kid) throw new Error("missing kid in header"); // TODO better error report
    const jwk = configuration.private_jwks.keys.find((key) => key.kid === header.kid);
    if (!jwk) throw new Error("no matching key with kid found"); // TODO better error report
    return await jose.importJWK(jwk, inferAlgForJWK(jwk));
  });
  return new TextDecoder().decode(plaintext);
}

async function verify(authenticationRequestEntity: AuthenticationRequestEntity, jws: string) {
  try {
    const { payload } = await jose.compactVerify(jws, async (header) => {
      if (!header.kid) throw new Error("missing kid in header"); // TODO better error report
      const jwk = authenticationRequestEntity.provider_jwks.keys.find((key) => key.kid === header.kid);
      if (!jwk) throw new Error("no matching key with kid found"); // TODO better error report
      return await jose.importJWK(jwk, inferAlgForJWK(jwk));
    });
    return new TextDecoder().decode(payload);
  } catch (error) {
    // user info jwt verificatrion failed, this should not happen
    // TODO check if resolved
    // TODO file issue upstream
    return jose.decodeJwt(jws);
  }
}

export type UserInfo = Record<string, unknown>;
