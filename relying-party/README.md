# SPID/CIE OIDC Federation Relying Party, for Node.js

[![Relying Party Test Node.js CI](https://github.com/italia/spid-cie-oidc-nodejs/actions/workflows/relying-party-test-node.js.yml/badge.svg)](https://github.com/italia/spid-cie-oidc-nodejs/actions/workflows/relying-party-test-node.js.yml) [![npm](https://img.shields.io/npm/v/spid-cie-oidc.svg)](https://www.npmjs.com/package/spid-cie-oidc)

This package includes building blocks to implement openid federation relaying party into your application.

It is framework agnostic so you will need to write some adapter code.

It is written in [TypeScript](https://www.typescriptlang.org/), the typings are already in the package.

More detailed descriptions are provided with [JSDoc](https://jsdoc.app/about-getting-started.html), use an IDE like [vscode](https://code.visualstudio.com/docs/editor/intellisense) to see them.

## Installation

`npm install spid-cie-oidc`

## Usage

The simplest way to set the Relying Part up is by using the utilty function `ConfigurationFacade`:

```typescript
import { ConfigurationFacade, EndpointHandlers } from 'spid-cie-oidc';

const configuration = await ConfigurationFacade({
  client_id: "http://127.0.0.1:3000",
  client_name: "My Application",
  contacts: ["me@mail.com"],
  trust_anchors: ["http://127.0.0.1:8000/"],
  identity_providers: ["http://127.0.0.1:8000/oidc/op/"]
});

const {
  providerList,
  entityConfiguration,
  authorization,
  callback,
  revocation,
} = await EndpointHandlers(configuration);
```

These endpoints must be then exposed by your application.

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

All endpoints have similar signature, they accept a **single `request` (`AgnosticRequest`) parameter** and return a **`response` (`AgnosticResponse`)**.

`AgnosticRequest` object properties:

| Name      | Type                | Description                                                             |
| --------- | ------------------- | ----------------------------------------------------------------------- |
| `url`     | `string`            | The complete URL of the receiving requests.                             |
| `headers` | `object`            | A dynamic key:value object of HTTP Headers received.                    |
| `query`   | generic (see below) | The parsed Query String as a key:value object. Depends on the endpoint. |

`AgnosticResponse` object properties:

| Name      | Type                | Description                                                             |
| --------- | ------------------- | ----------------------------------------------------------------------- |
| `status`  | `number`            | The HTTP Response Status Code.                                          |
| `headers` | `object` (optional) | A dynamic key:value object of HTTP Headers to send. May be `undefined`. |
| `body`    | `string` (optional) | The HTTP Response body to send. May be `undefined`.                     |

There are three different kind of endpoints:

1. **System Endpoints** are expected to be forwarded as they are to the user-agent, the developer is **not** expected to customize them;
2. **User-facing Endpoints** are expected to be customized in order to integrate your application authentication flow.

#### `entityConfiguration` Endpoint

This is the System Endpoint that **MUST** be used on the route `<client_id>/.well-known/openid-federation`, with `client_id` as the Entity Identifier configured during the onboarding with the Federation.

For example (with Express):

```typescript
app.get("/oidc/rp/.well-known/openid-federation", (req, res) => {
  // ...
});
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

This is a User-facing Endpoint and you are expected …

lists available identity providers

use this list to make create links for logging in

```html
<a href="127.0.0.1:3000/oidc/rp/authorization?provider=http://127.0.0.1:8000/oidc/op/">
  login
</a>
```

#### `authorization` Endpoint

user lands here from a link provided in login page

**required** paramater is provider url

```js
const response = await authorization({
  query: {
    provider: "http://127.0.0.1:8000/oidc/rp"
  }
});
```

#### `callback` Endpoint

provider will redirect user browser to this endpoint after user authenticate and grants access

it **MUST** be used on the route `${configuration.redirect_uris[0]}`

```url
http://127.0.0.1:3000/oidc/rp/callback
```

#### `revocation` Endpoint

called from frontend to logout the user


## Tests

Tests can be run with `yarn test`

Code coverage can be checked with `yarn test:coverage`