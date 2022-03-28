import express, { Request, Response } from "express";
import * as jose from "jose";
import { Configuration } from "./Configuration";
import {
  AgnosticRequest,
  AgnosticResponse,
  EndpointHandlers,
} from "./EndpointHandlers";

export function ExpressRouter(configuration: Configuration) {
  const handlers = EndpointHandlers(configuration);

  const router = express.Router();

  router.get("/providers", async (req, res) => {
    const response = await handlers.providerList();
    adaptReponse(response, res);
  });

  router.get("/authorization", async (req, res) => {
    const request = adaptRequest(req);
    const response = await handlers.authorization(request);
    adaptReponse(response, res);
  });

  router.get("/callback", async (req, res) => {
    const request = adaptRequest(req);
    const response = await handlers.callback(request);
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

  router.get("/revocation", async (req, res) => {
    if (!req.session.user_info) throw new Error(); // TODO externalize session retreival
    const response = await handlers.revocation(req.session.user_info);
    req.session.destroy((error) => {
      if (error) throw new Error(); // TODO decide what to do with the error
    });
    adaptReponse(response, res);
  });

  router.get("/.well-known/openid-federation", async (req, res) => {
    const response = await handlers.entityConfiguration();
    adaptReponse(response, res);
  });

  // TODO move elsewhere
  router.get("/configuration-helper", async (req, res) => {
    const { publicKey, privateKey } = await jose.generateKeyPair("RS256");
    const publicJWK = await jose.exportJWK(publicKey);
    const kid = await jose.calculateJwkThumbprint(publicJWK);
    publicJWK.kid = kid;
    const privateJWK = await jose.exportJWK(privateKey);
    privateJWK.kid = kid;
    res.send(`
      <h1>JWK generation utility</h1>
      <p>reload page to get a fresh one</p>
      <p>public key</p>
      <pre>${JSON.stringify(publicJWK, null, 2)}</pre>
      <p>private key</p>
      <pre>${JSON.stringify(privateJWK, null, 2)}</pre>
    `);
  });

  return router;
}

function adaptRequest(req: Request): AgnosticRequest<any> {
  return { query: req.query };
}

function adaptReponse(response: AgnosticResponse, res: Response) {
  res.status(response.status);
  for (const [headerName, headerValue] of Object.entries(response.headers)) {
    res.set(headerName, headerValue);
  }
  res.send(response.body);
}
