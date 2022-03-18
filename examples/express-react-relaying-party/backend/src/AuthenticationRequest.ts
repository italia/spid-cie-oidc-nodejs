import crypto from "crypto";
import { createJWS, makeIat } from "./uils";
import { Configuration } from "./Configuration";
import { EntityConfiguration } from "./EntityConfiguration";

// TODO refactor to a object that can be converted to GET or POST request
// TODO create POST version
export async function createAuthenticationRequest_GET(
  configuration: Configuration,
  {
    provider,
    scope = "openid",
    redirect_uri = configuration.redirect_uris[0],
    acr_values = "https://www.spid.gov.it/SpidL2", // TODO get from onboarding data
    prompt = "consent login",
    profile = "spid",
  }: {
    provider: string;
    scope?: string;
    redirect_uri?: string;
    acr_values?: string;
    prompt?: string;
    profile?: string;
  }
) {
  // TODO provider is a known provider
  // TODO validate scope parameter (should be space sperated list of supported scopes, must inclulde openid)
  // TODO validate prompt inculdes supported values (space separated)
  // TODO validate redirect_uri is well formed

  // TODO get trust chain properly
  const trustChain = {
    sub: "http://127.0.0.1:8000/oidc/op/",
  };
  const authz_endpoint = "http://127.0.0.1:8000/oidc/op/authorization"; // TODO
  const endpoint = authz_endpoint;
  const nonce = generateRandomString(32); // TODO need to be saved somewhere
  const state = generateRandomString(32); // TODO need to be saved somewhere
  const { code_verifier, code_challenge, code_challenge_method } = getPKCE(); // TODO store code_verifier somewhere
  const response_type = configuration.response_types[0];
  const client_id = configuration.sub;
  const iat = makeIat();
  const aud = [trustChain.sub, authz_endpoint];
  const claims = configuration.providers[profile].requestedClaims;
  const iss = client_id;
  const sub = client_id;
  // TODO check which relaying_party jwks can be used with the provider
  const jwk = configuration.privateJWKS[0];
  const request = await createJWS(
    {
      scope,
      redirect_uri,
      response_type,
      nonce,
      state,
      client_id,
      endpoint,
      acr_values,
      iat,
      aud,
      claims,
      prompt,
      code_challenge,
      code_challenge_method,
      iss,
      sub,
    },
    jwk
  );
  return `${authz_endpoint}?${new URLSearchParams({
    scope,
    redirect_uri,
    nonce,
    state,
    response_type,
    client_id,
    endpoint,
    acr_values,
    iat: iat.toString(),
    aud: JSON.stringify(aud),
    claims: JSON.stringify(claims),
    code_challenge,
    code_challenge_method,
    prompt,
    request,
  })}`;
}

function generateRandomString(length: number) {
  return crypto.randomBytes(length).toString("hex");
}

// TODO support more code challange methods
function getPKCE() {
  const REPLACEME_length = 64; // TODO read from config
  const code_verifier = generateRandomString(REPLACEME_length);
  const code_challenge_method = "S256"; // TODO read from config
  const code_challenge = crypto
    .createHash("sha256")
    .update(code_verifier)
    .digest("base64url");
  return {
    code_verifier,
    code_challenge,
    code_challenge_method,
  };
}
