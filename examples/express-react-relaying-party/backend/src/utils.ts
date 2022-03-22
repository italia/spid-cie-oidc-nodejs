import * as jose from "jose";
import crypto from "crypto";
import { Configuration } from "./Configuration";

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