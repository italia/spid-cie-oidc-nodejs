import { AccessTokenRequest } from "./AccessTokenRequest";
import { AuthenticationRequest } from "./AuthenticationRequest";
import {
  Configuration,
  validateConfiguration,
} from "./Configuration";
import { EntityConfiguration } from "./EntityConfiguration";
import { dataSource } from "./persistance/data-source";
import { AccessTokenResponseEntity } from "./persistance/entity/AccessTokenResponseEntity";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { RevocationRequest } from "./RevocationRequest";
import { UserInfo } from "./UserInfo";
import { UserInfoRequest } from "./UserInfoRequest";
import { createJWS } from "./utils";

export async function EndpointHandlers(configuration: Configuration) {
  await validateConfiguration(configuration);
  return {
    /**
     * it **MUST** be used on the route `${configuration.client_id}./well-known/openid-configuration`
     */
    // used during onboarding with federation
    async entityConfiguration(): Promise<AgnosticResponse> {
      const jwk = configuration.private_jwks.keys[0]; // SHOULDDO make it configurable
      const entityConfiguration = EntityConfiguration(configuration);
      const jws = await createJWS(entityConfiguration, jwk);
      return {
        status: 200,
        headers: {
          "Content-Type": "application/entity-statement+jwt",
        },
        body: jws,
      };
    },
    /**
     * lists available identity providers
     * use this list to make create links for logging in
     * @example <a href="127.0.0.1:3000/oidc/rp/authorization?provider=http://127.0.0.1:8000/oidc/op/">login</a>
     */
    async providerList(): Promise<AgnosticResponse> {
      return {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          configuration.identity_providers.map((id) => {
            return {
              id,
              name: "",
              img: "",
            };
          })
        ),
      };
    },
    /**
     * user lands here from a link provided in login page
     *
     * **required** paramater is provider url
     * @example const response = await authorization({query: {provider: "http://127.0.0.1:8000/oidc/rp"}})
     */
    async authorization(
      request: AgnosticRequest<{
        provider: string;
        scope?: string;
        redirect_uri?: string;
        acr_values?: string;
        prompt?: string;
      }>
    ): Promise<AgnosticResponse> {
      const provider = request.query.provider as string; // TODO validate that is a string
      const scope = request.query.scope as string; // TODO validate that is a string or undefined
      const redirect_uri = request.query.redirect_uri as string; // TODO validate that is a string or undefined
      const acr_values = request.query.acr_values as string; // TODO validate that is a string or undefined
      const prompt = request.query.prompt as string; // TODO validate that is a string or undefined
      const authenticationRequest = await AuthenticationRequest(configuration, {
        provider,
        scope,
        redirect_uri,
        acr_values,
        prompt,
      });
      await dataSource.manager.save(authenticationRequest.asEntity());
      const { url: redirectUrl } = await authenticationRequest.asGetRequest();
      return {
        status: 302,
        headers: {
          Location: redirectUrl,
        },
      };
    },
    /**
     * provider will redirect user browser to this endpoint after user authenticate and grants access
     *
     * it **MUST** be used on the route `${configuration.redirect_uris[0]}`
     * @example "http://127.0.0.1:3000/oidc/rp/callback"
     */
    //
    async callback(
      request: AgnosticRequest<
        | { code: string; state: string }
        | { error: string; error_description?: string }
      >
    ): Promise<AgnosticResponse> {
      if ("error" in request.query) {
        // TODO validate request.query.error is a string
        if (typeof request.query.error !== "string") throw new Error(); // TODO better error managment
        if (
          !(
            typeof request.query.error_description === "string" ||
            request.query.error_description === undefined
          )
        ) {
          throw new Error(); // TODO better error managment
        }
        const error = request.query.error;
        const error_description = request.query.error_description;
        return {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ error, error_description }),
        };
      } else if ("code" in request.query) {
        // TODO validate code is string
        if (typeof request.query.code !== "string") throw new Error(); // TODO rewrite with validator
        // TODO validate state is string
        if (typeof request.query.state !== "string") throw new Error(); // TODO rewrite with validator
        const authentication_request = await dataSource.manager.findOne(
          AuthenticationRequestEntity,
          { where: { state: request.query.state } }
        );
        if (!authentication_request) {
          return {
            status: 401,
            headers: {},
            body: "Authentication not found",
          };
        }
        const accessTokenRequest = AccessTokenRequest(
          configuration,
          authentication_request,
          { code: request.query.code }
        );
        const { id_token, access_token } = await accessTokenRequest.doPost();
        const user_info = await UserInfoRequest(
          configuration,
          authentication_request,
          access_token
        ).doGet();
        const user_identifier = configuration.deriveUserIdentifier(user_info);
        await dataSource.manager.save(
          dataSource.getRepository(AccessTokenResponseEntity).create({
            user_identifier,
            authentication_request,
            id_token,
            access_token,
            revoked: false,
          })
        );
        return {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user_info),
        };
      } else {
        throw new Error(); // TODO error managment
      }
    },
    /**
     * called from frontend to logout the user
     */
    async revocation(
      user_info: UserInfo,
    ): Promise<AgnosticResponse> {
      const revocationRequest = RevocationRequest(configuration, user_info);
      await revocationRequest.execute();
      // TODO some error managment
      return {
        status: 200,
        headers: {},
      };
    },
  };
}

export type AgnosticRequest<Query> = {
  query: Query;
};

export type AgnosticResponse = {
  status: number;
  headers: Record<string, string>;
  body?: string;
};
