# SPID/CIE OIDC Federation Relying Party, for Node.js

This package includes building blocks to implement openid federation relaying party into your application.

It is framework agnostic so you will need to write some adapter code.

It is written in [TypeScript](https://www.typescriptlang.org/), the typings are already in the package.

More detailed descriptions are provided with [JSDoc](https://jsdoc.app/about-getting-started.html), use an IDE like [vscode](https://code.visualstudio.com/docs/editor/intellisense) to see them.

#### Installation

`npm install @spid-cie-oidc-nodejs/relying-party`

#### Usage

```typescript
import { ConfigurationFacade, EndpointHandlers } from '@spid-cie-oidc-nodejs/relying-party';

const configuration = ConfigurationFacade({
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
} = EndpointHandlers(configuration);
```

These endpoints must be exposed by your application. (see JSDoc for the purpose of each endpoint)

Expressjs example: (see full example [here](../examples/express-react-relaying-party/backend/src/index.ts))

```typescript
app.get("/providers", async (req, res) => {
  const { status, headers, body } = await providerList();
  res.status(status);
  res.set("Content-Type", headers["Content-Type"]);
  res.send(body);
})
```

#### Test

Tests can be run with `yarn test`

Code coverage can be checked with `yarn test:coverage`