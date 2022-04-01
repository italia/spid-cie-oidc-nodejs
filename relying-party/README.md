# SPID/CIE OIDC Federation Relying Party, for Node.js

[![Relying Party Test Node.js CI](https://github.com/italia/spid-cie-oidc-nodejs/actions/workflows/relying-party-test-node.js.yml/badge.svg)](https://github.com/italia/spid-cie-oidc-nodejs/actions/workflows/relying-party-test-node.js.yml) [![npm](https://img.shields.io/npm/v/spid-cie-oidc.svg)](https://www.npmjs.com/package/spid-cie-oidc)

This package includes building blocks to implement openid federation relaying party into your application.

It is framework agnostic so you will need to write some adapter code.

It is written in [TypeScript](https://www.typescriptlang.org/), the typings are already in the package.

More detailed descriptions are provided with [JSDoc](https://jsdoc.app/about-getting-started.html), use an IDE like [vscode](https://code.visualstudio.com/docs/editor/intellisense) to see them.

## Installation

`npm install spid-cie-oidc`

## Usage

```typescript
import {
  EndpointHandlers,
  createLogRotatingFilesystem,
  createAuditLogRotatingFilesystem,
} from "spid-cie-oidc";

// create functions that will manage authentication with bare minimum configuration
const {
  validateConfiguration,
  retrieveAvailableProviders,
  createEntityConfigurationResponse,
  createAuthorizationRedirectURL,
  manageCallback,
  revokeAccessTokensByUserIdentifier,
} = EndpointHandlers({
  client_id: `http://127.0.0.1:3000/oidc/rp/`,
  client_name: "My Application",
  trust_anchors: ["http://127.0.0.1:8000/"],
  identity_providers: {
    spid: ["http://127.0.0.1:8000/oidc/op/"],
    cie: ["http://127.0.0.1:8002/oidc/op/"]
  },
  public_jwks_path: "./public.jwks.json",
  private_jwks_path: "./private.jwks.json",
  trust_marks_path: "./trust_marks.json",
  logger: createLogRotatingFilesystem(),
  auditLogger: createAuditLogRotatingFilesystem(),
});

// ensure you call this method to catch early configuration errors
validateConfiguration().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

### Example endpoint usage

Expressjs example: (see full example [here](../examples/express-react-relying-party/backend/src/index.ts))

```typescript
app.get("/providers", async (req, res) => {
  const { status, headers, body } = await providerList();
  res.status(status);
  res.set("Content-Type", headers["Content-Type"]);
  res.send(body);
})
```

### Endpoints

Several endpoinst **MUST** be exposed.

Detailed descriptions of how each endpoint works follows.

#### `entityConfiguration` Endpoint

This is a System-facing endpoint that **MUST** be used on the route `<client_id>/.well-known/openid-federation`, with `client_id` as the Entity Identifier configured during the onboarding with the Federation.

This endpoint will be called by other servers of the federation and has fixed form of response.

For example (with Express):

```typescript
app.get("/oidc/rp/.well-known/openid-federation", (req, res) => {
  createEntityConfigurationResponse()
    .then((response) => {
      res.status(response.status);
      res.set("Content-Type", response.headers["Content-Type"]);
      res.send(response.body);      
    })
    .catch((error) => {
      // here goes your error managment
    })
})
```

<details>
<summary>
<strong>⚠️ Attention! More details for Client IDs with a path segment</strong>
</summary>

> It may be that your Client ID / Entity Identifier contains a path:
>
>     https://example.com/my/application
>                        ╰─┬───────────╯
>                         Path
>
> In this case you _SHOULD_ serve your Entity Configuration endpoint as follows:
>
>     https://example.com/.well-known/openid-federation/my/application
>                        ╰─┬──────────────────────────╯╰─┬───────────╯
>                         Endpoint Path                 Path
>
> But in order to support multi-tenancy the [OpenID Connect specification](https://openid.net/specs/openid-connect-federation-1_0.html#federation_configuration) allows for an alternative structure, disregarding [RFC 8615 (Well-Known URIs)](https://www.rfc-editor.org/rfc/rfc8615):
>
>     https://example.com/my/application/.well-known/openid-federation
>                        ╰─┬───────────╯╰─┬──────────────────────────╯
>                         Path           Endpoint Path                
>
> Since this secondary form is not mandatory and callers are only _RECOMMENDED_ to support it, if you can install the endpoint as a root `/.well-known` path that should be your first option.
</details>

#### `providerList` Endpoint

This is a User-facing Endpoint that can be served on arbitrary route, it can return a JSON response for example if called from fronted or render static html.

It lists available identity providers by type. Use this list to make create links for logging in

```html
<a href="127.0.0.1:3000/oidc/rp/authorization?provider=http://127.0.0.1:8000/oidc/op/">
  login
</a>
```

For example (with Express):

```typescript
app.get("/providers", (req, res) => {
  retrieveAvailableProviders(providers)
    .then((response) => {
      res.json(providers);
    })
    .catch((error) => {
      // here goes your error managment
    })
});
```

The response body will look like

```json
{
  "spid": [
    {
      "sub": "http://127.0.0.1:8000/oidc/op/",
      "organization_name": "SPID OIDC identity provider",
      "logo_uri": "http://127.0.0.1:8000/static/svg/spid-logo-c-lb.svg"
    }
  ],
  "cie": [
    {
      "sub": "http://127.0.0.1:8000/oidc/op/",
      "organization_name": "CHIE OIDC identity provider",
      "logo_uri": "http://127.0.0.1:8000/static/svg/cie-logo-c-lb.svg"
    }
  ]
}
```

#### `authorization` Endpoint

This is a User-facing Endpoint that can be served on arbitrary route, it **MUST** redirect the user browser to the identity provider server chosen.

User lands here from a link provided in login page.

It must be a standalone endpoint because creating an authorization request is a stateful operation. This means that `createAuthorizationRedirectURL` **MUST** be called only once for each time a user clicks on a login link.

For example (with Express):

```typescript
// in this example we assume the user clicked on a login link of this form
// <a href="/authorization?provider=http://127.0.0.1:8000/">Login</a>
app.get("/authorization", (req, res) => {
  createAuthorizationRedirectURL(req.query.provider)
    .then((redirectUrl) => {
      res.redirect(redirectUrl);
    })
    .catch((error) => {
      // here goes your error managment
    })
});
```

#### `callback` Endpoint

This is a System-facing Endpoint that **MUST** be served on `${configuration.redirect_uris[0]}` route. The identity provider redirects user browser to this endpoint after user authenticate and grant access or some error occurs during this process. This endpoint can redirect the user to a route in case of an single page application or render static html.

Route examples:

If you used `EndpointHandlers({client_id: "mydomain.com", ...})`, the `redirect_uris` property of the configuration will be `["http://mydomain.com/callback"]` and this endpoint **MUST** be served on `http://mydomain.com/callback` route.

If you used `EndpointHandlers({client_id: "mydomain.com", redirect_uris: ["mydomain.com/openid-connect-callback"], ...})`, this endpoint **MUST** be served on `http://mydomain.com/openid-connect-callback` route.

There are two cases for this endpoint:

- Error
  - it will receive this kind of query url `?error=...&error_description="..."` (where error_description is optional)
- Succcess
  - it will receive this kind of query url `?code=...&state=...` (both parameters mandatory)

The `manageCallback` function **MUST** be called only once for each time this endpoint is used as it is a stateful operation.

Then `manageCallback` function will return a Promise that can 
  - resolve to:
    - `{ type: "authentication-success", user_info: "...", user_identifier: "..."}` (if the user has granted access)
      - in this case you as you must:
        - store the user_info in the server side session
        - redirect or render a page to the user
    - `{ type: "authentication-error", error: "...", error_description: "..."}` (if the user has denied access or some error occurs during the authentication process on the identity provider server side)
      - i this case you must:
        - redirect or render a page to the user
  - reject with an error (something gone wrong on our relying party)

For example (with Express):

```typescript
app.get("/callback", (req, res) => {
  manageCallback(req.query)
    .then(outcome => {
      switch (outcome.type) {
        case "authentication-success": {
          // store the user_info in the session
          req.session.user_info = outcome.user_info;
          req.session.user_identifier = outcome.user_identifier;
          // redirect to a page where the user can continue to use the application because the authentication was successful
          res.redirect(`/attributes`);
          break;
        }
        case "authentication-error": {
          // redirect to a page to inform the user that something went wrong during the authentication process
          res.redirect(
            `/error?${new URLSearchParams({
              error: outcome.error,
              error_description: outcome.error_description ?? "",
            })}`
          );
          break;
        }
      }
    })
    .catch((error) => {
      // here goes your error managment
    })
});
```

#### `revocation` Endpoint

This is a User-facing Endpoint that can be served on arbitrary route, it can return a JSON response for example if called from fronted or render static html.

`revokeAccessTokensByUserIdentifier(user_identifier)` revokes all access tokens issued to the user identified by `user_identifier`.

The `user_identifier` is obtained by calling `configuration.deriveUserIdentifier(user_info)` function.

For example (with Express):

```typescript
app.get("/logout", (req, res) => {
  if (!req.session.user_identifier) {
    res.status(400).json({ error: "user is not logged in" });
    return;
  }
  revokeAccessTokensByUserIdentifier(req.session.user_identifier)
    .then(() => {
      req.session.destroy(() => {
        res.json({ message: "user logged out" })
      })
    })
    .catch((error) => {
      // here goes your error managment
    })
});
```

## Tests

Tests can be run with `yarn test`

Code coverage can be checked with `yarn test:coverage`
