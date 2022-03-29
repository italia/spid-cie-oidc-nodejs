import { request } from "undici";
import { Configuration } from "./Configuration";
import { dataSource } from "./persistance/data-source";
import { AccessTokenResponseEntity } from "./persistance/entity/AccessTokenResponseEntity";
import { UserInfo } from "./UserInfo";
import { createJWS, getPrivateJWKforProvider, makeExp, makeIat, makeJti } from "./utils";

export async function RevocationRequest(configuration: Configuration, user_info: UserInfo) {
  const user_identifier = configuration.deriveUserIdentifier(user_info);
  const accessTokenRequestEntities = await dataSource.manager.find(AccessTokenResponseEntity, {
    where: { user_identifier, revoked: false },
    relations: { authentication_request: true },
  });
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
    accessTokenRequestEntity.revoked = true;
    await dataSource.manager.save(accessTokenRequestEntity); // TODO refactor to a better places

    // fetch part
    // -------------------

    // TODO when doing post request ensure timeout and ssl is respected
    const response = await request(url, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    });
    if (response.statusCode !== 200) {
      // console.log(response.statusCode, await response.body.json());
      // throw new Error(); // TODO
    }

    // TODO validate reponse
  }
  // TODO audit log revocation request
}
