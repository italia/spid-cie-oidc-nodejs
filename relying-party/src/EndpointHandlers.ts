import { AccessTokenRequest } from "./AccessTokenRequest";
import { AuthenticationRequest } from "./AuthenticationRequest";
import { Configuration, validateConfiguration } from "./Configuration";
import { ConfigurationFacade, ConfigurationFacadeOptions } from "./ConfigurationFacade";
import { EntityConfiguration } from "./EntityConfiguration";
import { dataSource } from "./persistance/data-source";
import { AccessTokenResponseEntity } from "./persistance/entity/AccessTokenResponseEntity";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { RevocationRequest } from "./RevocationRequest";
import { getTrustChain } from "./TrustChain";
import { UserInfoRequest } from "./UserInfoRequest";
import { isString, isUndefined } from "./utils";

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
    async validateConfiguration() {
      await setupConfiguration();
    },

    async retrieveAvailableProviders(): Promise<Record<string, Array<ProviderInfo>>> {
      const configuration = await setupConfiguration();

      try {
        const trust_chains = await Promise.all(
          configuration.identity_providers.map((identity_providers_id) =>
            getTrustChain(configuration, identity_providers_id)
          )
        );
        return {
          spid: trust_chains.flatMap((trustChain) => {
            if (!trustChain) {
              return [];
            } else {
              return {
                sub: trustChain.entity_configuration.sub,
                organization_name: trustChain.entity_configuration.metadata?.openid_provider?.organization_name,
                logo_uri: trustChain.entity_configuration.metadata?.openid_provider?.logo_uri,
              };
            }
          }),
        };
      } catch (error) {
        configuration.logger.error(error);
        throw error;
      }
    },

    async createEntityConfigurationResponse() {
      const configuration = await setupConfiguration();

      try {
        const jws = await EntityConfiguration(configuration);
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
        const authenticationRedirectUrl = await AuthenticationRequest(configuration, {
          provider,
        });
        configuration.logger.info({ authenticationRedirectUrl });
        return authenticationRedirectUrl;
      } catch (error) {
        configuration.logger.error(error);
        throw error;
      }
    },

    async manageCallback(query: { code: string; state: string } | { error: string; error_description?: string }) {
      const configuration = await setupConfiguration();

      configuration.logger.info({ callback: { query } });
      try {
        if ("error" in query) {
          if (!isString(query.error)) {
            throw new Error("error is mandatory string parameter");
          }
          if (!(isString(query.error_description) || isUndefined(query.error_description))) {
            throw new Error("error_description is optional string parameter");
          }
          configuration.logger.info({
            type: "authentication-error",
            error: query.error,
            error_description: query.error_description,
          });
          return {
            type: "authentication-error" as const,
            error: query.error,
            error_description: query.error_description,
          };
        } else if ("code" in query) {
          if (!isString(query.code)) {
            throw new Error("code is mandatory string parameter");
          }
          if (!isString(query.state)) {
            throw new Error("state is mandatory string parameter");
          }
          const { state, code } = query;
          const authentication_request = await dataSource.manager.findOne(AuthenticationRequestEntity, {
            where: { state },
          });
          if (!authentication_request) {
            throw new Error(`authentication request not found for state ${state}`);
          }
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
          return { type: "authentication-success" as const, user_info, user_identifier };
        } else {
          throw new Error(`callback type not supported ${JSON.stringify(query)}`);
        }
      } catch (error) {
        configuration.logger.error(error);
        throw error;
      }
    },

    async revokeAccessTokensByUserIdentifier(user_identifier: string) {
      const configuration = await setupConfiguration();

      configuration.logger.info({ type: "revocation", user_identifier });
      try {
        const revokeTokensCount = await RevocationRequest(configuration, user_identifier);
        return revokeTokensCount;
      } catch (error) {
        configuration.logger.error(error);
        throw error;
      }
    },
  };
}
