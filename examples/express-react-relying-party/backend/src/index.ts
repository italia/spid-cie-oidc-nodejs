import express, { Request, Response } from "express";
import path from "path";
import session from "express-session";
import {
  AgnosticRequest,
  AgnosticResponse,
  EndpointHandlers,
  createLogRotatingFilesystem,
  createAuditLogRotatingFilesystem,
} from "spid-cie-oidc";

main();
async function main() {
  const PORT = 3000;

  const auditLogger = createAuditLogRotatingFilesystem();
  const logger = createLogRotatingFilesystem();

  const {
    validate,
    retrieveAvailableProviders,
    entityConfiguration,
    authorization,
    callback,
    revocation,
  } = EndpointHandlers({
    client_id: `http://127.0.0.1:${PORT}/oidc/rp/`,
    client_name: "My Application",
    trust_anchors: ["http://127.0.0.1:8000/"],
    identity_providers: ["http://127.0.0.1:8000/oidc/op/"],
    public_jwks_path: "./public.jwks.json",
    private_jwks_path: "./private.jwks.json",
    trust_marks_path: "./trust_marks.json",
    logger,
    auditLogger,
  });

  await validate();

  function adaptRequest(req: Request): AgnosticRequest<any> {
    return {
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      headers: req.headers as Record<string, string>,
      query: req.query,
    };
  }

  function adaptReponse(response: AgnosticResponse, res: Response) {
    res.status(response.status);
    if (response.headers) {
      for (const [headerName, headerValue] of Object.entries(
        response.headers
      )) {
        res.set(headerName, headerValue);
      }
    }
    res.send(response.body);
  }

  const app = express();

  // TODO use encrypted cookie instead
  app.use(session({ secret: "spid-cie-oidc-nodejs" }));

  app.get("/oidc/rp/providers", async (req, res) => {
    res.json(await retrieveAvailableProviders());
  });

  app.get("/oidc/rp/authorization", async (req, res) => {
    const request = adaptRequest(req);
    const response = await authorization(request);
    adaptReponse(response, res);
  });

  app.get("/oidc/rp/callback", async (req, res) => {
    const request = adaptRequest(req);
    const response = await callback(request);
    if (response.status === 200 && response.body) {
      req.session.user_info = JSON.parse(response.body);
      res.redirect(`/attributes`);
    } else if (response.status === 400 && response.body) {
      const { error, error_description } = JSON.parse(response.body);
      res.redirect(
        `/error?${new URLSearchParams({ error, error_description })}`
      );
    } else {
      adaptReponse(response, res);
    }
  });

  app.get("/oidc/rp/revocation", async (req, res) => {
    if (!req.session.user_info) throw new Error(); // TODO externalize session retreival
    const request = adaptRequest(req);
    request.query.user_info = req.session.user_info;
    const response = await revocation(request);
    req.session.destroy((error) => {
      if (error) throw new Error(); // TODO decide what to do with the error
    });
    adaptReponse(response, res);
  });

  app.get("/oidc/rp/.well-known/openid-federation", async (req, res) => {
    const request = adaptRequest(req);
    const response = await entityConfiguration();
    adaptReponse(response, res);
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
}

declare module "express-session" {
  interface SessionData {
    user_info?: unknown;
  }
}

// TODO session (create, destroy, update) default implementation ecrypted cookie
// TODO authorizationRequest access token storage default implementation in memory?
