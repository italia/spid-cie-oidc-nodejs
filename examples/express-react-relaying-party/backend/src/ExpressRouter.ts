import express from "express";
import * as jose from "jose";
import { Configuration } from "./Configuration";
import { EntityConfiguration } from "./EntityConfiguration";
import { createJWS } from "./uils";
import { createAuthenticationRequest_GET } from "./AuthenticationRequest";

const REPLACEME_LANDING_ROUTE = "landing";
const REPLACEME_AUTHORIZATION_ROUTE = "authorization";
export const REPLACEME_CALLBACK_ROUTE = "callback";
const REPLACEME_ATTRIBUTES_ROUTE = "attributes";
const REPLACEME_LOGOUT_ROUTE = "logout";
const REPLACEME_CONFIGURATION_ROUTE = ".well-known/openid-federation";

export function ExpressRouter(
  configuration: Configuration
) {
  const router = express.Router();

  // initial page where user lands
  // shows buttons to login with various providers
  router.get("/" + REPLACEME_LANDING_ROUTE, (req, res) => {
    // TODO get trust chain
    // serve definitive ui
    res.end(`
      <a
        href="${REPLACEME_AUTHORIZATION_ROUTE}?provider=http://127.0.0.1:8000/oidc/op/"
      >Login with SPID</a>
    `);
  });

  // user lands here from a link provided in landing page
  // rquired paramater is provider url
  router.get("/" + REPLACEME_AUTHORIZATION_ROUTE, async (req, res) => {
    const provider = req.query.provider as string; // TODO validate that is a string
    const scope = req.query.scope as string; // TODO validate that is a string or undefined
    const redirect_uri = req.query.redirect_uri as string; // TODO validate that is a string or undefined
    const acr_values = req.query.acr_values as string; // TODO validate that is a string or undefined
    const prompt = req.query.prompt as string; // TODO validate that is a string or undefined
    const redirectUrl = createAuthenticationRequest_GET(configuration, {
      provider,
      scope,
      redirect_uri,
      acr_values,
      prompt,
    });
    res.redirect(await redirectUrl);
  });

  // provider will redirect here after user authenticate and grants access
  router.get("/" + REPLACEME_CALLBACK_ROUTE, (req, res) => {});

  // show claims (attributes) about the user
  router.get("/" + REPLACEME_ATTRIBUTES_ROUTE, (req, res) => {});

  router.get("/" + REPLACEME_LOGOUT_ROUTE, (req, res) => {});

  // must be exposed by spec, used during onboarding with federation
  router.get("/" + REPLACEME_CONFIGURATION_ROUTE, async (req, res) => {
    const jwk = configuration.privateJWKS[0]; // TODO make it configurable
    const entityConfiguration = EntityConfiguration(configuration);
    const jws = await createJWS(entityConfiguration, jwk);
    res.set("Content-Type", "application/entity-statement+jwt");
    res.end(jws);
  });

  // TODO move elsewhere
  router.get("/configuration-helper", async (req, res) => {
    const { publicKey, privateKey } = await jose.generateKeyPair("RS256");
    const publicJWK = await jose.exportJWK(publicKey);
    const kid = await jose.calculateJwkThumbprint(publicJWK);
    publicJWK.kid = kid;
    const privateJWK = await jose.exportJWK(privateKey);
    privateJWK.kid = kid;
    res.end(`
    <html>
      <h1>JWK generation utility</h1>
      <p>reload page to get a fresh one</p>
      <p>public key</p>
      <pre>${JSON.stringify(publicJWK, null, 2)}</pre>
      <p>private key</p>
      <pre>${JSON.stringify(privateJWK, null, 2)}</pre>
    </html>
    `);
  });

  return router;
}
