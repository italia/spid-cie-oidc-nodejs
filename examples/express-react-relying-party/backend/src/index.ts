import express from "express";
import path from "path";
import session from "express-session";
import {
  EndpointHandlers,
  createLogRotatingFilesystem,
  createAuditLogRotatingFilesystem,
} from "spid-cie-oidc";

const PORT = 3000;

const auditLogger = createAuditLogRotatingFilesystem();
const logger = createLogRotatingFilesystem();

const {
  validateConfiguration,
  retrieveAvailableProviders,
  createEntityConfigurationResponse,
  createAuthorizationRedirectURL,
  manageCallback,
  revokeAccessTokensByUserIdentifier,
} = EndpointHandlers({
  client_id: `http://127.0.0.1:${PORT}/oidc/rp/`,
  client_name: "My Application",
  trust_anchors: ["http://127.0.0.1:8000/"],
  identity_providers: {
    spid: ["http://127.0.0.1:8000/oidc/op/"],
    cie: ["http://127.0.0.1:8002/oidc/op/"],
  },
  public_jwks_path: "./public.jwks.json",
  private_jwks_path: "./private.jwks.json",
  trust_marks_path: "./trust_marks.json",
  logger,
  auditLogger,
});

validateConfiguration().catch((error) => {
  console.error(error);
  process.exit(1);
});

const app = express();

// TODO use encrypted cookie instead or change storage for production
app.use(session({ secret: "spid-cie-oidc-nodejs" }));
declare module "express-session" {
  interface SessionData {
    user_info?: unknown;
    user_identifier?: string;
  }
}

app.get("/oidc/rp/providers", async (req, res) => {
  try {
    res.json(await retrieveAvailableProviders());
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/oidc/rp/authorization", async (req, res) => {
  try {
    res.redirect(
      await createAuthorizationRedirectURL(req.query.provider as string)
    );
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/oidc/rp/callback", async (req, res) => {
  try {
    const outcome = await manageCallback(req.query as any);
    switch (outcome.type) {
      case "authentication-success": {
        req.session.user_info = outcome.user_info;
        req.session.user_identifier = outcome.user_identifier;
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
    if (!req.session.user_identifier) {
      res.status(400).json({ error: "user_identifier not found in session" });
      return;
    }
    const revokedTokenCount = await revokeAccessTokensByUserIdentifier(
      req.session.user_identifier
    );
    req.session.destroy(() => {
      res.json({ revokedTokenCount });
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/oidc/rp/.well-known/openid-federation", async (req, res) => {
  try {
    const response = await createEntityConfigurationResponse();
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

app.listen(PORT, () => {
  console.log(`Open browser at http://127.0.0.1:${PORT}`);
});

// TODO github actions per pushare docker image
// TODO session (create, destroy, update) default implementation ecrypted cookie
// TODO authorizationRequest access token storage default implementation in memory?
