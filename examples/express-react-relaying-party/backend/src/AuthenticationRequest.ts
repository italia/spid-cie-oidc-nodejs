import crypto from "crypto";
import * as jose from "jose";
import { REPLACEME_REQUEST_CLAIM } from "./settings";

// TODO refactor to a object that can be converted to GET or POST request
// TODO create POST version
export async function createAuthenticationRequest_GET({
  provider,
  scope = "openid",
  redirect_uri = "http://localhost:3000/oidc/rp/callback", // TODO get default value from client_conf["redirect_uris"][0]
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
}) {
  // TODO provider is a known provider
  // TODO validate scope parameter (should be space sperated list of supported scopes, must inclulde openid)
  // TODO validate prompt inculdes supported values (space separated)
  // TODO validate redirect_uri is well formed

  // TODO get trust chain properly
  const trustChain = {
    sub: "http://127.0.0.1:8000/oidc/op/",
  };
  const authz_endpoint = "http://127.0.0.1:8000/oidc/op/authorization"; // TODO !!!!!!!!
  const endpoint = authz_endpoint;
  const nonce = generateRandomString(32); // TODO need to be saved somewhere
  const state = generateRandomString(32); // TODO need to be saved somewhere
  const { code_verifier, code_challenge, code_challenge_method } = getPKCE(); // TODO store code_verifier somewhere
  const response_type = "code"; // TODO get from client_conf["response_types"][0]
  const client_id = "http://127.0.0.1:8000/oidc/rp/"; // TODO get from client_conf["client_id"]
  const iat = Date.now();
  const aud = [trustChain.sub, authz_endpoint];
  const claims = REPLACEME_REQUEST_CLAIM[profile];
  const iss = client_id;
  const sub = client_id;
  // TODO get from entity_conf.jwks[0]
  const jwk = {
    kty: "RSA",
    kid: "2HnoFS3YnC9tjiCaivhWLVUJ3AxwGGz_98uRFaqMEEs",
    n: "5s4qi1Ta-sEuKb5rJ8TzHmyGKaSu89pIXIi6w4Ekx6GL56mJDNE_MWJHsFjWXajfMdMQmZrSXAvLtXxmbhUui9Mq_IormhmEyyEJS0SyE9UKTxWzi0yd_n_C7OjFBhM-0ZyUlgl81E_sr-35P1A6b5WSYwMvRSR-P9yx_NI-XBQ48G_zdmk3CbuuzZsXZqqgj5U7OGWH-4Huosn9nH3FVkwX0OlWkgWM-J9DEWzGBjl9hfbbrMtM_obljHL2NfT6RJYER2IpdI8RCyQS3sMPt6ZHDskmuNlyMDNATCChXQJLnltwEjxcgvzjw_G9J25DwfdfVEhDF_0kCp44UMmS3Q",
    e: "AQAB",
    d: "kXg7xFmVMxpy2AiWTRiLCw_nd3O-eR-JIBllbTeGUPR202o9YQC5TYzeFj3HznxTQHoBKm80SqN8n0Rq4tMi5SoRG96SIKwY0FZgHzqK6okJ2FKbOR7vLaqk1uDW3T9gBokj9XTBYqeFTFU3FTqhuhaRjypArtmTYPjejbSNbUZ29r2UjlMY92y-w4-IVDD9cWlI5I75QA1iWrmPF2t80uk9qqZFde8ZwWsvqqJym-I-x7T34SfMVhJQPbts6VzsUFAUZbT6kVKuUzffSdnr-QeQgj2dR-ULjcN3Y_M-6oc_n25Cz_xFgv3_3hLveizP6inooBzyhgTD1nlR7cWNgQ",
    p: "_XLjTNHt1OfGbaHae50Sm_C4dWp_fNNt1__cUNJ62bxJgFG3KlnwbRWtztXGe-BThMyMXK1HHjjUCf66FQGmfoDYTe7qz9j0OBctKMdkoAjTTYZdOYXu3G9U3HddnB-6bnd8fNnKidGAiseWi1eCoViEqeZ7cVULeOlI-ZOB500",
    q: "6SDtrFt50EL37kgcaKVttxXjz7JbanH5q-mLgV_tzBcdjEeg1lSv9-7pRDPNedF7KD-FsaT-2YSrPrc2F8z6_aKE7M_TCUv-m2LdLbvvB0iqO_kOjkdd1v9I-3qOq3Yvvd_SYTb81uAFTEFeRXoE7sLINOCO8ClCWa95nEFOMdE",
  };
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
  // .replace("=",""); // TODO verify if necessary
  return {
    code_verifier,
    code_challenge,
    code_challenge_method,
  };
}

async function createJWS<Payload extends jose.JWTPayload>(
  payload: Payload,
  jwk: jose.JWK
) {
  const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
  // const privateKey = await jose.importJWK(jwk, 'RS256'); // TODO make this work
  const { publicKey, privateKey } = await jose.generateKeyPair("PS256"); // TODO get from confs
  return new jose.CompactSign(encodedPayload)
    .setProtectedHeader({ alg: "RS256" })
    .sign(privateKey);
}
