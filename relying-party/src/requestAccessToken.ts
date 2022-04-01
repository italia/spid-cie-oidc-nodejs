import { Configuration } from "./configuration";
import { createJWS, getPrivateJWKforProvider, httpRequest, isString, makeExp, makeIat, makeJti } from "./utils";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { isUndefined } from "lodash";

export async function requestAccessToken(
  configuration: Configuration,
  authenticationRequestEntity: AuthenticationRequestEntity,
  code: string
) {
  const request = {
    url: authenticationRequestEntity.token_endpoint,
    method: "POST" as const,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: authenticationRequestEntity.redirect_uri,
      client_id: configuration.client_id,
      state: authenticationRequestEntity.state,
      code,
      code_verifier: authenticationRequestEntity.code_verifier,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: await createJWS(
        {
          iss: configuration.client_id,
          sub: configuration.client_id,
          aud: [authenticationRequestEntity.token_endpoint],
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
  const response = await httpRequest(request);
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
