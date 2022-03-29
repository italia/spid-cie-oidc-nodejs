import { Configuration } from "./Configuration";
import { createJWS, getPrivateJWKforProvider, makeExp, makeIat, makeJti } from "./utils";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { request } from "undici";

export async function AccessTokenRequest(
  configuration: Configuration,
  authenticationRequestEntity: AuthenticationRequestEntity,
  { code }: { code: string }
) {
  const token_endpoint = authenticationRequestEntity.token_endpoint;
  const iss = configuration.client_id;
  const sub = configuration.client_id;
  const iat = makeIat();
  const exp = makeExp();
  const jti = makeJti();
  const jwk = getPrivateJWKforProvider(configuration);
  const client_assertion_type = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
  const state = authenticationRequestEntity.state;
  const code_verifier = authenticationRequestEntity.code_verifier;
  const client_id = configuration.client_id;
  const redirect_uri = authenticationRequestEntity.redirect_uri;
  const grant_type = "authorization_code";
  const url = token_endpoint;
  const params = {
    grant_type,
    redirect_uri,
    client_id,
    state,
    code,
    code_verifier,
    client_assertion_type,
    client_assertion: await createJWS({ iss, sub, aud: [token_endpoint], iat, exp, jti }, jwk),
  };
  // TODO when doing post request ensure timeout and ssl is respected
  const response = await request(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
  if (response.statusCode !== 200) {
    throw new Error(); // TODO better error reporting
  }
  // TODO validate reponse
  return (await response.body.json()) as {
    id_token: string;
    access_token: string;
    refresh_token?: string; // if offline_access scope is requested
  };
}
