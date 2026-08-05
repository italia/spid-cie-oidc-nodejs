import express from "express";
import fs from "fs";
import path from "path";
import session from "express-session";
import {
  createRelyingParty,
  UserInfo,
  Tokens,
  createLogRotatingFilesystem,
  createAuditLogRotatingFilesystem,
  createInMemoryAsyncStorage,
} from "spid-cie-oidc";

const port = process.env.PORT ?? 3000;
const client_id = process.env.CLIENT_ID ?? `http://127.0.0.1:${port}/oidc/rp/`;
const trust_anchors = process.env.TRUST_ANCHOR
  ? [process.env.TRUST_ANCHOR]
  : ["http://127.0.0.1:8000/"];
const identity_providers = process.env.IDENTITY_PROVIDER
  ? [process.env.IDENTITY_PROVIDER]
  : ["http://127.0.0.1:8000/oidc/op/"];

// The trusted public keys of each trust anchor, obtained out of band during
// onboarding. They are mandatory: the fetched Trust Anchor Entity Configuration
// is verified against these pinned keys so a network attacker cannot substitute
// the trust anchor keys (and the authorization servers) with its own.
// Provide a JSON file mapping each trust anchor url to its JWKS, e.g.:
//   { "http://127.0.0.1:8000/": { "keys": [ ... ] } }
const trust_anchors_jwks = JSON.parse(
  fs.readFileSync(process.env.TRUST_ANCHORS_JWKS_PATH ?? "./trust_anchors.jwks.json", "utf-8")
);

const relyingParty = createRelyingParty({
  client_id,
  client_name: "My Application",
  trust_anchors,
  trust_anchors_jwks,
  identity_providers: {
    spid: identity_providers,
    cie: ["http://127.0.0.1:8002/oidc/op/"],
  },
  public_jwks_path: "./public.jwks.json",
  private_jwks_path: "./private.jwks.json",
  trust_marks_path: "./trust_marks.json",
  logger: createLogRotatingFilesystem(),
  auditLogger: createAuditLogRotatingFilesystem(),
  storage: createInMemoryAsyncStorage(),
});

relyingParty.validateConfiguration().catch((error) => {
  console.error(error);
  process.exit(1);
});

const app = express();

app.use(session({ secret: "spid-cie-oidc-nodejs" }));
declare module "express-session" {
  interface SessionData {
    user_info?: UserInfo;
    tokens?: Tokens;
  }
}

app.get("/oidc/rp/providers", async (req, res) => {
  try {
    res.json(await relyingParty.retrieveAvailableProviders());
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/oidc/rp/authorization", async (req, res) => {
  try {
    res.redirect(
      await relyingParty.createAuthorizationRedirectURL(
        req.query.provider as string
      )
    );
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/oidc/rp/callback", async (req, res) => {
  try {
    const outcome = await relyingParty.manageCallback(req.query as any);
    switch (outcome.type) {
      case "authentication-success": {
        req.session.user_info = outcome.user_info;
        req.session.tokens = outcome.tokens;
        res.redirect(`/attributes`);
        break;
      }
      case "authentication-error": {
        res.redirect(
          `/error?${new URLSearchParams({
            error: outcome.error,
            error_description: outcome.error_description ?? "",
          })}`
        );
        break;
      }
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/oidc/rp/revocation", async (req, res) => {
  try {
    if (!req.session.tokens) {
      res.status(400).json({ error: "user is not logged in" });
    } else {
      await relyingParty.revokeTokens(req.session.tokens);
      req.session.destroy(() => {
        res.json({ message: "user logged out" });
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/oidc/rp/.well-known/openid-federation", async (req, res) => {
  try {
    const response = await relyingParty.createEntityConfigurationResponse();
    res.status(response.status);
    res.set("Content-Type", response.headers["Content-Type"]);
    res.send(response.body);
  } catch (error) {
    res.status(500).json(error);
  }
});

// this endpoint is outside of the oidc lib
// so you can provide your own way of storing and retreiving user data
app.get("/oidc/rp/user_info", (req, res) => {
  if (req.session.user_info) {
    res.json(req.session.user_info);
  } else {
    res.status(401).send("User is not legged in");
  }
});

// serve frontend static files
app.use(express.static("frontend/build"));
// every route leads back to index beacuse it is a single page application
app.get("*", (req, res) =>
  res.sendFile(path.resolve("frontend/build/index.html"))
);

app.listen(port, () => {
  console.log(`Open browser at http://127.0.0.1:${port}`);
});
