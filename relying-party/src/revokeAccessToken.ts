import { Configuration } from "./configuration";
import { createJWS, getPrivateJWKforProvider, makeExp, makeIat, makeJti } from "./utils";

export type Tokens = Readonly<{
  id_token: string;
  access_token: string;
  refresh_token?: string;
  revocation_endpoint: string;
}>;

export async function revokeAccessToken(configuration: Configuration, tokens: Tokens) {
  const request = {
    url: tokens.revocation_endpoint,
    method: "POST" as const,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: tokens.access_token,
      client_id: configuration.client_id,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: await createJWS(
        {
          iss: configuration.client_id,
          sub: configuration.client_id,
          aud: [tokens.revocation_endpoint],
          iat: makeIat(),
          exp: makeExp(),
          jti: makeJti(),
        },
        getPrivateJWKforProvider(configuration)
      ),
    }).toString(),
  };
  configuration.logger.info({ message: `Revocation request`, request });
  // SHOULDDO when doing post request ensure timeout and ssl is respected
  const response = await configuration.httpClient(request);
  if (response.status === 200) {
    configuration.logger.info({ message: `Revocation request succeeded`, request, response });
  } else {
    configuration.logger.warn({ message: `Revocation request failed`, request, response });
    throw new Error("Revocation request failed");
  }
}
