import { AccessTokenRequest } from "./AccessTokenRequest";
import { AuthenticationRequest } from "./AuthenticationRequest";
import { Configuration, validateConfiguration } from "./Configuration";
import { EntityConfiguration } from "./EntityConfiguration";
import { dataSource } from "./persistance/data-source";
import { AccessTokenResponseEntity } from "./persistance/entity/AccessTokenResponseEntity";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { RevocationRequest } from "./RevocationRequest";
import { UserInfo } from "./UserInfo";
import { UserInfoRequest } from "./UserInfoRequest";
import { isString, isUndefined, REPLACEME_logError } from "./utils";

export async function EndpointHandlers(configuration: Configuration) {
  await validateConfiguration(configuration);
  return {
    /**
     * it **MUST** be used on the route `${configuration.client_id}./well-known/openid-configuration`
     *
     * used during onboarding with federation
     */
    async entityConfiguration(): Promise<AgnosticResponse> {
      try {
        const jws = await EntityConfiguration(configuration);
        return {
          status: 200,
          headers: { "Content-Type": "application/entity-statement+jwt" },
          body: jws,
        };
      } catch (error) {
        REPLACEME_logError(error);
        return { status: 500 };
      }
    },
    /**
     * lists available identity providers
     *
     * use this list to make create links for logging in
     *
     * @example <a href="127.0.0.1:3000/oidc/rp/authorization?provider=http://127.0.0.1:8000/oidc/op/">login</a>
     */
    async providerList(): Promise<AgnosticResponse> {
      return {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          configuration.identity_providers.map((id) => {
            return { id, name: "", img: "" };
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
      try {
        const provider = request.query.provider as string;
        if (!isString(provider)) {
          throw new BadRequestError("provider is mandatroy parameter");
        }
        const scope = request.query.scope;
        if (!(isString(scope) || isUndefined(scope))) {
          throw new BadRequestError("scope is optional string parameter");
        }
        const redirect_uri = request.query.redirect_uri;
        if (!(isString(redirect_uri) || isUndefined(redirect_uri))) {
          throw new BadRequestError("redirect_uri is optional string parameter");
        }
        const acr_values = request.query.acr_values;
        if (!(isString(acr_values) || isUndefined(acr_values))) {
          throw new BadRequestError("acr_values is optional string parameter");
        }
        const prompt = request.query.prompt as string;
        if (!(isString(prompt) || isUndefined(prompt))) {
          throw new BadRequestError("prompt is optional string parameter");
        }
        const redirectUrl = await AuthenticationRequest(configuration, {
          provider,
          scope,
          redirect_uri,
          acr_values,
          prompt,
        });
        return {
          status: 302,
          headers: { Location: redirectUrl },
        };
      } catch (error) {
        if (error instanceof BadRequestError) {
          return {
            status: 400,
            body: error.message,
          };
        } else {
          REPLACEME_logError(error);
          return { status: 500 };
        }
      }
    },
    /**
     * provider will redirect user browser to this endpoint after user authenticate and grants access
     *
     * it **MUST** be used on the route `${configuration.redirect_uris[0]}`
     * @example "http://127.0.0.1:3000/oidc/rp/callback"
     */
    async callback(
      request: AgnosticRequest<{ code: string; state: string } | { error: string; error_description?: string }>
    ): Promise<AgnosticResponse> {
      try {
        if ("error" in request.query) {
          if (!isString(request.query.error)) {
            throw new BadRequestError("error is mandatory string parameter");
          }
          if (!(isString(request.query.error_description) || isUndefined(request.query.error_description))) {
            throw new BadRequestError("error_description is optional string parameter");
          }
          const error = request.query.error;
          const error_description = request.query.error_description;
          return {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error, error_description }),
          };
        } else if ("code" in request.query) {
          if (!isString(request.query.code)) {
            throw new BadRequestError("code is mandatory string parameter");
          }
          if (!isString(request.query.state)) {
            throw new BadRequestError("state is mandatory string parameter");
          }
          const state = request.query.state;
          const code = request.query.code;
          const authentication_request = await dataSource.manager.findOne(AuthenticationRequestEntity, {
            where: { state },
          });
          if (!authentication_request) throw new Error(`authentication request not found for state ${state}`);
          const { id_token, access_token } = await AccessTokenRequest(configuration, authentication_request, { code });
          const user_info = await UserInfoRequest(configuration, authentication_request, access_token);
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
          throw new BadRequestError(JSON.stringify(request.query, null, 2));
        }
      } catch (error) {
        if (error instanceof BadRequestError) {
          return {
            status: 400,
            body: error.message,
          };
        } else {
          REPLACEME_logError(error);
          return { status: 500 };
        }
      }
    },
    /**
     * called from frontend to logout the user
     */
    async revocation(user_info: UserInfo): Promise<AgnosticResponse> {
      try {
        await RevocationRequest(configuration, user_info);
        return { status: 200 };
      } catch (error) {
        REPLACEME_logError(error);
        return { status: 500 };
      }
    },
  };
}

export type AgnosticRequest<Query> = {
  query: Query;
};

export type AgnosticResponse = {
  status: number;
  headers?: Record<string, string>;
  body?: string;
};

class BadRequestError extends Error {}
