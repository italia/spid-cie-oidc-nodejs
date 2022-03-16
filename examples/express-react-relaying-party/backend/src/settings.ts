// example project settings

export const REPLACEME_OIDC_ROUTE_PREFIX = "/oidc/rp/"; // TODO read from environment
export const REPLACEME_PORT = 3000; // TODO read from environment
const REPLACEME_DOMAIN = `http://localhost:${REPLACEME_PORT}`; // TODO move to relaying party

// relaying party settings

export const REPLACEME_LANDING_ROUTE = REPLACEME_OIDC_ROUTE_PREFIX + "landing"; // TODO read from config
export const REPLACEME_AUTHORIZATION_ROUTE =
  REPLACEME_OIDC_ROUTE_PREFIX + "authorization"; // TODO read from config
export const REPLACEME_CALLBACK_ROUTE =
  REPLACEME_OIDC_ROUTE_PREFIX + "callback"; // TODO read from config
export const REPLACEME_LOGOUT_ROUTE = REPLACEME_OIDC_ROUTE_PREFIX + "logout"; // TODO read from config
export const REPLACEME_ATTRIBUTES_ROUTE =
  REPLACEME_OIDC_ROUTE_PREFIX + "attributes"; // TODO move to example project

const DEFAULT_REQUEST_CLAIM = {
  spid: {
    id_token: {
      "https://attributes.spid.gov.it/familyName": { essential: true },
      "https://attributes.spid.gov.it/email": { essential: true },
    },
    userinfo: {
      "https://attributes.spid.gov.it/name": null,
      "https://attributes.spid.gov.it/familyName": null,
      "https://attributes.spid.gov.it/email": null,
      "https://attributes.spid.gov.it/fiscalNumber": null,
    },
  },
  cie: {
    id_token: { family_name: { essential: true }, email: { essential: true } },
    userinfo: {
      given_name: null,
      family_name: null,
      email: null,
    },
  },
};

export const REPLACEME_REQUEST_CLAIM: Record<string, unknown> = DEFAULT_REQUEST_CLAIM; // TODO read from config
