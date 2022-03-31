import { AccessTokenRequest } from "./AccessTokenRequest";
import { AuthenticationRequest } from "./AuthenticationRequest";
import { Configuration, validateConfiguration } from "./Configuration";
import { ConfigurationFacade, ConfigurationFacadeOptions } from "./ConfigurationFacade";
import { EntityConfiguration } from "./EntityConfiguration";
import { dataSource } from "./persistance/data-source";
import { AccessTokenResponseEntity } from "./persistance/entity/AccessTokenResponseEntity";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { RevocationRequest } from "./RevocationRequest";
import { CachedTrustChain } from "./TrustChain";
import { UserInfo, UserInfoRequest } from "./UserInfoRequest";
import { BadRequestError, isString, isUndefined } from "./utils";

type ProviderInfo = {
  sub: string;
  organization_name: string;
  logo_uri?: string;
};

export function EndpointHandlers(configurationFacade: ConfigurationFacadeOptions) {
  let _configuration: Configuration | null = null;

  async function setupConfiguration() {
    if (_configuration == null) {
      _configuration = await ConfigurationFacade(configurationFacade);
      await validateConfiguration(_configuration);
    }

    return _configuration;
  }

  return {
    /**
     * Runs the validation of the configuration.
     */
    async validate() {
      await setupConfiguration();
    },

    async retrieveAvailableProviders(): Promise<Record<string, Array<ProviderInfo>>> {
      const configuration = await setupConfiguration();

      try {
        const trust_chains = await Promise.all(
          configuration.identity_providers.map((identity_providers_id) =>
            CachedTrustChain(
              configuration,
              configuration.client_id,
              identity_providers_id,
              configuration.trust_anchors[0] // TODO
            )
          )
        );

        return {
          spid: trust_chains.filter(Boolean).map((tc) => ({
            sub: tc.entity_configuration.sub,
            organization_name: tc.entity_configuration.metadata?.openid_provider?.organization_name,
            logo_uri: tc.entity_configuration.metadata?.openid_provider?.logo_uri,
          })),
        };
      } catch (error) {
        configuration.logger.error(error);
        throw error;
      }
    },

    async entityConfiguration(): Promise<AgnosticResponse> {
      const configuration = await setupConfiguration();

      try {
        const jws = await EntityConfiguration(configuration);
        const response = {
          status: 200,
          headers: { "Content-Type": "application/entity-statement+jwt" },
          body: jws,
        };

        configuration.logger.info({ response });
        return response;
      } catch (error) {
        configuration.logger.error(error);
        return { status: 500 };
      }
    },

    async authorization(
      request: AgnosticRequest<{
        provider: string;
        scope?: string;
        redirect_uri?: string;
        acr_values?: string;
        prompt?: string;
      }>
    ): Promise<AgnosticResponse> {
      const configuration = await setupConfiguration();

      configuration.logger.info({ request });

      try {
        const { provider, scope, redirect_uri, acr_values, prompt } = request.query;

        if (!isString(provider)) {
          throw new BadRequestError("provider is mandatory parameter");
        }

        if (!(isString(scope) || isUndefined(scope))) {
          throw new BadRequestError("scope is optional string parameter");
        }

        if (!(isString(redirect_uri) || isUndefined(redirect_uri))) {
          throw new BadRequestError("redirect_uri is optional string parameter");
        }

        if (!(isString(acr_values) || isUndefined(acr_values))) {
          throw new BadRequestError("acr_values is optional string parameter");
        }

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

        const response = { status: 302, headers: { Location: redirectUrl } };

        configuration.logger.info({ response });

        return response;
      } catch (error) {
        if (error instanceof BadRequestError) {
          configuration.logger.info({ error });

          return { status: 400, body: error.message };
        } else {
          configuration.logger.error(error);
          return { status: 500 };
        }
      }
    },

    async callback(
      request: AgnosticRequest<{ code: string; state: string } | { error: string; error_description?: string }>
    ): Promise<AgnosticResponse> {
      const configuration = await setupConfiguration();

      configuration.logger.info({ request });

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
          const response = {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error, error_description }),
          };
          configuration.logger.info({ response });
          return response;
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
          configuration.logger.warn({ error });
          return { status: 400, body: error.message };
        } else {
          configuration.logger.error(error);
          return { status: 500 };
        }
      }
    },

    async revocation(request: AgnosticRequest<{ user_info: UserInfo }>): Promise<AgnosticResponse> {
      const configuration = await setupConfiguration();

      configuration.logger.info({ request });
      try {
        if (!request.query.user_info) {
          throw new BadRequestError("user_info is mandatory parameter");
        }
        await RevocationRequest(configuration, request.query.user_info);
        const response = { status: 200 };
        configuration.logger.info({ response });
        return response;
      } catch (error) {
        if (error instanceof BadRequestError) {
          configuration.logger.warn({ error });
          return { status: 400, body: error.message };
        } else {
          configuration.logger.error(error);
          return { status: 500 };
        }
      }
    },
  };
}

export type AgnosticRequest<Query> = {
  url: string;
  headers: Record<string, string>;
  query: Query;
};

export type AgnosticResponse = {
  status: number;
  headers?: Record<string, string>;
  body?: string;
};
