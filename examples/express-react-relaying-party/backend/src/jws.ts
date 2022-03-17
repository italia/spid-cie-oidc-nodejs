import * as jose from "jose";

export async function createJWS<Payload extends jose.JWTPayload>(
  payload: Payload,
  jwk: jose.JWK
) {
  // TODO import properly also other types of algorithms
  const privateKey = await jose.importJWK(jwk, "RS256");
  const jws = new jose.CompactSign(
    new TextEncoder().encode(JSON.stringify(payload))
  )
    .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
    .sign(privateKey);
  return jws;
}
