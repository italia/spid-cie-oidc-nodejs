import { requestAccessToken } from "./requestAccessToken";
import { createAuthenticationRequest } from "./createAuthenticationRequest";
import {
  Configuration,
  createConfigurationFromConfigurationFacade,
  ConfigurationFacadeOptions,
  validateConfiguration,
} from "./configuration";
import { createEntityConfiguration } from "./createEntityConfiguration";
import { dataSource } from "./persistance/data-source";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { revokeAccessToken, Tokens } from "./revokeAccessToken";
import { getTrustChain } from "./getTrustChain";
import { requestUserInfo } from "./requestUserInfo";
import { isString, isUndefined } from "./utils";

export function createRelyingParty(configurationFacade: ConfigurationFacadeOptions) {
  let _configuration: Configuration | null = null;

  async function setupConfiguration() {
    if (_configuration == null) {
      _configuration = await createConfigurationFromConfigurationFacade(configurationFacade);
      await validateConfiguration(_configuration);
    }

    return _configuration;
  }

  return {
    /**
     * Runs the validation of the configuration.
     */
    async validateConfiguration() {
      await setupConfiguration();
    },

    async retrieveAvailableProviders(): Promise<
      Record<
        string,
        Array<{
          sub: string;
          organization_name: string;
          logo_uri?: string;
        }>
      >
    > {
      const configuration = await setupConfiguration();

      try {
        const getProviderInfo = async (provider: string) => {
          const trustChain = await getTrustChain(configuration, provider);
          if (!trustChain) return null;
          return {
            sub: trustChain.entity_configuration.sub,
            organization_name: trustChain.entity_configuration.metadata?.openid_provider?.organization_name,
            logo_uri: trustChain.entity_configuration.metadata?.openid_provider?.logo_uri,
          };
        };
        return Object.fromEntries(
          await Promise.all(
            Object.entries(configuration.identity_providers).map(async ([providerProfile, providers]) => {
              return [providerProfile, (await Promise.all(providers.map(getProviderInfo))).filter(Boolean)];
            })
          )
        );
      } catch (error) {
        configuration.logger.error(error);
        throw error;
      }
    },

    async createEntityConfigurationResponse() {
      const configuration = await setupConfiguration();

      try {
        const jws = await createEntityConfiguration(configuration);
        const response = {
          status: 200,
          headers: { "Content-Type": "application/entity-statement+jwt" },
          body: jws,
        };
        return response;
      } catch (error) {
        configuration.logger.error(error);
        throw error;
      }
    },

    async createAuthorizationRedirectURL(provider: string) {
      const configuration = await setupConfiguration();
      try {
        if (!isString(provider)) {
          throw new Error("provider is mandatory parameter");
        }
        return await await createAuthenticationRequest(configuration, provider);
      } catch (error) {
        configuration.logger.error(error);
        throw error;
      }
    },

    async manageCallback(query: { code: string; state: string } | { error: string; error_description?: string }) {
      const configuration = await setupConfiguration();

      configuration.logger.info({ message: "Callback function called", query });
      try {
        if ("error" in query) {
          if (!isString(query.error)) {
            throw new Error("error is mandatory string parameter");
          }
          if (!(isString(query.error_description) || isUndefined(query.error_description))) {
            throw new Error("error_description is optional string parameter");
          }
          configuration.logger.info({ message: "Callback function called with error", query });
          return { type: "authentication-error" as const, ...query };
        } else if ("code" in query) {
          if (!isString(query.code)) {
            throw new Error("code is mandatory string parameter");
          }
          if (!isString(query.state)) {
            throw new Error("state is mandatory string parameter");
          }
          const authentication_request = await dataSource.manager.findOne(AuthenticationRequestEntity, {
            where: { state: query.state },
          });
          if (!authentication_request) {
            configuration.logger.warn({
              message: "Callback function called with code but corresponding authentication with not found",
              query,
            });
            throw new Error(`authentication request not found for state ${query.state}`);
          }
          const { id_token, access_token, refresh_token } = await requestAccessToken(
            configuration,
            authentication_request,
            query.code
          );
          const user_info = await requestUserInfo(configuration, authentication_request, access_token);
          const tokens: Tokens = {
            id_token,
            access_token,
            refresh_token,
            revocation_endpoint: authentication_request.revocation_endpoint,
          };
          return { type: "authentication-success" as const, user_info, tokens };
        } else {
          throw new Error(`callback type not supported ${JSON.stringify(query)}`);
        }
      } catch (error) {
        configuration.logger.error(error);
        throw error;
      }
    },

    async revokeTokens(tokens: Tokens) {
      const configuration = await setupConfiguration();
      try {
        return await revokeAccessToken(configuration, tokens);
      } catch (error) {
        configuration.logger.error(error);
        throw error;
      }
    },
  };
}
