import crypto from "crypto";
import * as fs from "fs";
import * as jose from "jose";
import * as uuid from "uuid";
import { Configuration } from "./Configuration";

export async function createJWS<Payload extends jose.JWTPayload>(payload: Payload, jwk: jose.JWK) {
  const privateKey = await jose.importJWK(jwk, inferAlgForJWK(jwk));
  const jws = new jose.CompactSign(new TextEncoder().encode(JSON.stringify(payload)))
    .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
    .sign(privateKey);
  return jws;
}

// now timestamp in seconds
export function makeIat() {
  return Math.floor(Date.now() / 1000);
}

// now + delta timestamp in seconds
export function makeExp(deltaSeconds = 33 * 60) {
  return Math.floor(makeIat() + deltaSeconds);
}

export function makeJti() {
  return uuid.v4();
}

export function generateRandomString(length: number) {
  return crypto.randomBytes(length).toString("hex");
}

// SHOULDDO implement
export function getPrivateJWKforProvider(configuration: Configuration) {
  return configuration.private_jwks.keys[0];
}

export function inferAlgForJWK(jwk: jose.JWK) {
  if (jwk.kty === "RSA") return "RS256";
  if (jwk.kty === "EC") return "ES256";
  // SHOULDDO support more types
  throw new Error("unsupported key type");
}

export async function generateJWKS() {
  const { publicKey, privateKey } = await jose.generateKeyPair("RS256");
  const publicJWK = await jose.exportJWK(publicKey);
  const kid = await jose.calculateJwkThumbprint(publicJWK);
  publicJWK.kid = kid;
  const privateJWK = await jose.exportJWK(privateKey);
  privateJWK.kid = kid;
  return {
    public_jwks: { keys: [publicJWK] },
    private_jwks: { keys: [privateJWK] },
  };
}

export function isValidURL(url: string) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

export function isValidEmail(email: string) {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export async function fileExists(path: string) {
  try {
    await fs.promises.stat(path);
    return true;
  } catch (error) {
    return false;
  }
}

export async function readJSON<T = any>(path: string) {
  return JSON.parse(await fs.promises.readFile(path, "utf8")) as T;
}
