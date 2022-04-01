import { request } from "undici";
import { Configuration } from "./Configuration";
import { dataSource } from "./persistance/data-source";
import { AccessTokenResponseEntity } from "./persistance/entity/AccessTokenResponseEntity";
import { createJWS, getPrivateJWKforProvider, makeExp, makeIat, makeJti } from "./utils";

export async function RevocationRequest(configuration: Configuration, user_identifier: string) {
  const accessTokenRequestEntities = await dataSource.manager.find(AccessTokenResponseEntity, {
    where: { user_identifier, revoked: false },
    relations: { authentication_request: true },
  });
  configuration.logger.info({ message: `Revoking active access tokens for ${user_identifier}` });
  for (const accessTokenRequestEntity of accessTokenRequestEntities) {
    const revocation_endpoint = accessTokenRequestEntity.authentication_request.revocation_endpoint;
    const url = revocation_endpoint;
    const client_assertion_type = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
    const client_id = configuration.client_id;
    const access_token = accessTokenRequestEntity.access_token;
    const token = access_token;
    const iss = client_id;
    const sub = client_id;
    const iat = makeIat();
    const exp = makeExp();
    const jti = makeJti();
    const jwk = getPrivateJWKforProvider(configuration);
    const params = {
      token,
      client_id,
      client_assertion: await createJWS(
        {
          iss,
          sub,
          aud: [revocation_endpoint],
          iat,
          exp,
          jti,
        },
        jwk
      ),
      client_assertion_type,
    };
    configuration.logger.info({
      message: `Revoking access token ${access_token.slice(0, 5)} for user ${user_identifier}`,
      url,
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    });
    // SHOULDDO when doing post request ensure timeout and ssl is respected
    const response = await request(url, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    });
    const bodyText = await response.body.text();
    if (response.statusCode !== 200) {
      configuration.logger.warn({
        message: `Revoked access token ${access_token.slice(0, 5)} for user ${user_identifier}`,
        statusCode: response.statusCode,
        headers: response.headers,
        body: bodyText,
      });
      accessTokenRequestEntity.revoked = true;
      await dataSource.manager.save(accessTokenRequestEntity);
    } else {
      configuration.logger.info({
        message: `Failed to revoked access token ${access_token.slice(0, 5)} for user ${user_identifier}`,
        statusCode: response.statusCode,
        headers: response.headers,
        body: bodyText,
      });
    }
    // TODO validate reponse
  }
}
