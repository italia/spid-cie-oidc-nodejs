import * as jose from "jose";
import crypto from "crypto";
import { Configuration } from "./Configuration";

export async function createJWS<Payload extends jose.JWTPayload>(
  payload: Payload,
  jwk: jose.JWK
) {
  const privateKey = await jose.importJWK(jwk, inferAlgForJWK(jwk));
  const jws = new jose.CompactSign(
    new TextEncoder().encode(JSON.stringify(payload))
  )
    .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
    .sign(privateKey);
  return jws;
}

export function makeIat() {
  return Date.now() / 1000;
}

export function generateRandomString(length: number) {
  return crypto.randomBytes(length).toString("hex");
}

// TODO implement
export function getPrivateJWKforProvider(configuration: Configuration) {
  return configuration.private_jwks.keys[0];
}

export function inferAlgForJWK(jwk: jose.JWK) {
  if (jwk.kty === "RSA") return "RS256";
  if (jwk.kty === "EC") return "ES256";
  // TODO support more types
  throw new Error("unsupported key type");
}