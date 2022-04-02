import { Configuration } from "./configuration";
import { createJWS, getPrivateJWKforProvider, isString, makeExp, makeIat, makeJti } from "./utils";
import { isUndefined } from "lodash";
import { AuthenticationRequest } from "./createAuthenticationRequest";

export async function requestAccessToken(
  configuration: Configuration,
  authenticationRequest: AuthenticationRequest,
  code: string
) {
  const request = {
    url: authenticationRequest.token_endpoint,
    method: "POST" as const,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: authenticationRequest.redirect_uri,
      client_id: configuration.client_id,
      state: authenticationRequest.state,
      code,
      code_verifier: authenticationRequest.code_verifier,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: await createJWS(
        {
          iss: configuration.client_id,
          sub: configuration.client_id,
          aud: [authenticationRequest.token_endpoint],
          iat: makeIat(),
          exp: makeExp(),
          jti: makeJti(),
        },
        getPrivateJWKforProvider(configuration)
      ),
    }).toString(),
  };
  // SHOULDDO when doing post request ensure timeout and ssl is respected
  configuration.logger.info({ message: "Access token request", request });
  const response = await configuration.httpClient(request);
  if (response.status === 200) {
    configuration.logger.info({ message: "Access token request succeeded", request, response });
    const tokens = JSON.parse(response.body);
    if (
      !isString(tokens.access_token) ||
      !isString(tokens.id_token) ||
      !(isUndefined(tokens.refresh_token) || isString(tokens.refresh_token))
    ) {
      throw new Error(`Invalid response from token endpoint: ${response.body}`);
    }
    configuration.auditLogger(tokens);
    return tokens as { id_token: string; access_token: string; refresh_token?: string };
  } else {
    configuration.logger.error({ message: "Access token request failed", request, response });
    throw new Error(`access token request failed`);
  }
}
