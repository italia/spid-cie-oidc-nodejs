import crypto from "crypto";
import { createJWS, generateRandomString, getPrivateJWKforProvider, isValidURL, makeIat } from "./utils";
import { Configuration, JWKs } from "./configuration";
import { getTrustChain } from "./getTrustChain";

export async function createAuthenticationRequest(configuration: Configuration, provider: string) {
  if (!isValidURL(provider)) {
    throw new Error(`Provider is not a valid url ${provider}`);
  }
  if (!Object.values(configuration.identity_providers).some((providers) => providers.includes(provider))) {
    throw new Error(`Provider is not supported ${provider}`);
  }
  const identityProviderTrustChain = await getTrustChain(configuration, provider);
  if (!identityProviderTrustChain) {
    throw new Error(`Unable to find trust chain for identity provider ${provider}`);
  }
  const {
    authorization_endpoint,
    token_endpoint,
    userinfo_endpoint,
    revocation_endpoint,
    jwks: provider_jwks,
  } = identityProviderTrustChain.entity_configuration.metadata.openid_provider;
  const profile = Object.entries(configuration.identity_providers).find(([, providers]) =>
    providers.includes(provider)
  )?.[0] as keyof Configuration["identity_providers"];
  const scope = "openid";
  const redirect_uri = configuration.redirect_uris[0];
  const acr_values = configuration.providers[profile].acr_values;
  const prompt = "consent login";
  const endpoint = authorization_endpoint;
  const nonce = generateRandomString(32);
  const state = generateRandomString(32);
  const { code_verifier, code_challenge, code_challenge_method } = getPKCE();
  const response_type = configuration.response_types[0];
  const client_id = configuration.client_id;
  const iat = makeIat();
  const aud = [provider, authorization_endpoint];
  const claims = configuration.providers[profile].requestedClaims;
  const iss = client_id;
  const sub = client_id;
  const jwk = getPrivateJWKforProvider(configuration);
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
  const url = `${authorization_endpoint}?${new URLSearchParams({
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
  await configuration.storage.write(state, {
    state,
    code_verifier,
    redirect_uri,
    token_endpoint,
    userinfo_endpoint,
    revocation_endpoint,
    provider_jwks,
  });
  configuration.logger.info({ message: "Authentication request created", url });
  return url;
}

// SHOULDDO support more code challange methods
function getPKCE() {
  const length = 64; // SHOULDDO read from config
  const code_verifier = generateRandomString(length);
  const code_challenge_method = "S256"; // SHOULDDO read from config
  const code_challenge = crypto.createHash("sha256").update(code_verifier).digest("base64url");
  return {
    code_verifier,
    code_challenge,
    code_challenge_method,
  };
}

export type AuthenticationRequest = {
  /** authentication reqest unique identifier (generated radnomly by relying party) */
  state: string;
  /** generated randomly by relying party */
  code_verifier: string;
  /** got from relying party configuration */
  redirect_uri: string;
  /** got from provider configuration */
  token_endpoint: string;
  /** got from provider configuration */
  userinfo_endpoint: string;
  /** got from provider configuration */
  revocation_endpoint: string;
  /** got from provider configuration */
  provider_jwks: JWKs;
};
