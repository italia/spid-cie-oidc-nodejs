import * as jose from "jose";
import { request } from "undici";
import { Configuration } from "./Configuration";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { UserInfo } from "./UserInfo";
import { inferAlgForJWK } from "./utils";

export async function UserInfoRequest(
  configuration: Configuration,
  authenticationRequestEntity: AuthenticationRequestEntity,
  access_token: string
) {
    // TODO ensure timeout and ssl is used when doing get request
    const url = authenticationRequestEntity.userinfo_endpoint;
    const response = await request(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (response.statusCode !== 200) throw new Error(); // TODO
    const jwe = await response.body.text();
    const jws = await decrypt(configuration, jwe);
    const jwt = await verify(authenticationRequestEntity, jws);
    return jwt as UserInfo // TODO validate;
}

async function decrypt(configuration: Configuration, jwe: string) {
  const { plaintext } = await jose.compactDecrypt(jwe, async (header) => {
    if (!header.kid) throw new Error("missing kid in header"); // TODO better error report
    const jwk = configuration.private_jwks.keys.find(
      (key) => key.kid === header.kid
    );
    if (!jwk) throw new Error("no matching key with kid found"); // TODO better error report
    return await jose.importJWK(jwk, inferAlgForJWK(jwk));
  });
  return new TextDecoder().decode(plaintext);
}

async function verify(
  authenticationRequestEntity: AuthenticationRequestEntity,
  jws: string
) {
  return jose.decodeJwt(jws); // TODO remove this line when te jws can be correctly verified
  const { payload } = await jose.compactVerify(jws, async (header) => {
    if (!header.kid) throw new Error("missing kid in header"); // TODO better error report
    const jwk = authenticationRequestEntity.provider_jwks.keys.find(
      (key) => key.kid === header.kid
    );
    if (!jwk) throw new Error("no matching key with kid found"); // TODO better error report
    return await jose.importJWK(jwk, inferAlgForJWK(jwk));
  });
  return new TextDecoder().decode(payload);
}
