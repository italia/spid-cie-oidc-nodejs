import express from "express";
import * as jose from "jose";
import {
  Configuration,
  validateRelayingPartyConfiguration,
} from "./Configuration";
import { EntityConfiguration } from "./EntityConfiguration";
import { createJWS } from "./utils";
import { AuthenticationRequest } from "./AuthenticationRequest";
import { dataSource } from "./persistance/data-source";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { AccessTokenRequest } from "./AccessTokenRequest";
import { UserInfoRequest } from "./UserInfoRequest";

const REPLACEME_LANDING_ROUTE = "landing"; // TODO change to "provider_list" to be fetched from frontend
const REPLACEME_AUTHORIZATION_ROUTE = "authorization";
export const REPLACEME_CALLBACK_ROUTE = "callback";
const REPLACEME_ATTRIBUTES_ROUTE = "attributes"; // TODO change to "user attributes" to be fetched from frontend
const REPLACEME_LOGOUT_ROUTE = "logout";
const REPLACEME_CONFIGURATION_ROUTE = ".well-known/openid-federation";

export function ExpressRouter(configuration: Configuration) {
  // TODO crash application if there are errors
  // TODO report developer friendly errors
  validateRelayingPartyConfiguration(configuration);

  // TODO manage error
  dataSource.initialize().then(
    () => {
      console.log("database connected");
    },
    () => console.log("database error")
  );

  const router = express.Router();

  // initial page where user lands
  // shows buttons to login with various providers
  router.get("/" + REPLACEME_LANDING_ROUTE, (req, res) => {
    // TODO get trust chain
    // serve definitive ui
    // TODO do not use unsafe html to prevent script injection
    res.send(`
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
    const authenticationRequest = AuthenticationRequest(configuration, {
      provider,
      scope,
      redirect_uri,
      acr_values,
      prompt,
    });
    await dataSource.manager.save(authenticationRequest.asEntity());
    const { url: redirectUrl } = await authenticationRequest.asGetRequest();
    res.redirect(redirectUrl);
  });

  // provider will redirect here after user authenticate and grants access
  router.get("/" + REPLACEME_CALLBACK_ROUTE, async (req, res) => {
    if (req.query.error) {
      // TODO validate req.query.error is a string
      // TODO translate req.query.error
      // TODO validate req.query.error_description is string or undefined
      // TODO translate req.query.error_description
      // TODO do not use unsafe html to prevent script injection
      res.send(`
        <h1>${req.query.error}</h1>
        <p>${req.query.error_description}</p>
      `);
    } else if (req.query.code) {
      // TODO validate code is string
      if (typeof req.query.code !== "string") throw new Error(); // TODO rewrite with validator
      // TODO validate state is string
      if (typeof req.query.state !== "string") throw new Error(); // TODO rewrite with validator
      // TODO validate iss is string
      const athenticationRequestEntity = await dataSource.manager.findOne(
        AuthenticationRequestEntity,
        { where: { state: req.query.state } }
      );
      if (!athenticationRequestEntity) {
        res.status(401).send("Authentication not found");
        return;
      }
      const accessTokenRequest = AccessTokenRequest(
        configuration,
        athenticationRequestEntity,
        { code: req.query.code }
      );
      const { id_token, access_token } = await accessTokenRequest.doPost();
      const userInfo = await UserInfoRequest(
        configuration,
        athenticationRequestEntity,
        access_token
      ).doGet();
      // TODO redirect su echo attributes (i claims sono ritrovati con user info)
      // TODO do not use unsafe html to prevent script injection
      res.send(`
        <pre>${JSON.stringify(userInfo, null, 2)}</pre>
        <a href="">logout</a>
      `);
    } else {
      // TODO error
    }
  });

  // show claims (attributes) about the user
  router.get("/" + REPLACEME_ATTRIBUTES_ROUTE, (req, res) => {});

  router.get("/" + REPLACEME_LOGOUT_ROUTE, (req, res) => {
    // TODO
  });

  // must be exposed by spec, used during onboarding with federation
  router.get("/" + REPLACEME_CONFIGURATION_ROUTE, async (req, res) => {
    const jwk = configuration.private_jwks.keys[0]; // TODO make it configurable
    const entityConfiguration = EntityConfiguration(configuration);
    const jws = await createJWS(entityConfiguration, jwk);
    res.set("Content-Type", "application/entity-statement+jwt");
    res.send(jws);
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
