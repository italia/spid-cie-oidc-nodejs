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
import { RevocationRequest } from "./RevocationRequest";
import { AccessTokenResponseEntity } from "./persistance/entity/AccessTokenResponseEntity";

const REPLACEME_PROVIDERS_ROUTE = "providers";
const REPLACEME_AUTHORIZATION_ROUTE = "authorization";
export const REPLACEME_CALLBACK_ROUTE = "callback";
const REPLACEME_REVOCATION_ROUTE = "revocation";
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
    (error) => console.log("database error", error)
  );

  const router = express.Router();

  // available providers
  // use this list to make create links for logging in ex: <a href="127.0.0.1:3000/oidc/rp/authorization?provider=http://127.0.0.1:8000/oidc/op/">login</a>
  router.get("/" + REPLACEME_PROVIDERS_ROUTE, (req, res) => {
    res.json(
      configuration.identity_providers.map((id) => {
        return {
          id,
          name: "",
          img: "",
        };
      })
    );
  });

  // user lands here from a link provided in landing page
  // rquired paramater is provider url
  router.get("/" + REPLACEME_AUTHORIZATION_ROUTE, async (req, res) => {
    const provider = req.query.provider as string; // TODO validate that is a string
    const scope = req.query.scope as string; // TODO validate that is a string or undefined
    const redirect_uri = req.query.redirect_uri as string; // TODO validate that is a string or undefined
    const acr_values = req.query.acr_values as string; // TODO validate that is a string or undefined
    const prompt = req.query.prompt as string; // TODO validate that is a string or undefined
    const authenticationRequest = await AuthenticationRequest(configuration, {
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
      if (typeof req.query.error !== "string") throw new Error(); // TODO better error managment
      if (
        !(
          typeof req.query.error_description === "string" ||
          req.query.error_description === undefined
        )
      ) {
        throw new Error(); // TODO better error managment
      }
      const error = req.query.error;
      const error_description = req.query.error_description;
      configuration.callbacks.onError(req, res, error, error_description);
    } else if (req.query.code) {
      // TODO validate code is string
      if (typeof req.query.code !== "string") throw new Error(); // TODO rewrite with validator
      // TODO validate state is string
      if (typeof req.query.state !== "string") throw new Error(); // TODO rewrite with validator
      // TODO validate iss is string
      const authentication_request = await dataSource.manager.findOne(
        AuthenticationRequestEntity,
        { where: { state: req.query.state } }
      );
      if (!authentication_request) {
        res.status(401).send("Authentication not found");
        return;
      }
      const accessTokenRequest = AccessTokenRequest(
        configuration,
        authentication_request,
        { code: req.query.code }
      );
      const { id_token, access_token } = await accessTokenRequest.doPost();
      const user_info = await UserInfoRequest(
        configuration,
        authentication_request,
        access_token
      ).doGet();
      const user_identifier = configuration.deriveUserIdentifier(user_info);
      await dataSource.manager.save(
        dataSource.getRepository(AccessTokenResponseEntity).create({
          user_identifier,
          authentication_request,
          id_token,
          access_token,
          revoked: false,
        })
      );
      configuration.callbacks.onLogin(req, res, user_info);
    } else {
      // TODO error
    }
  });

  // called from frontend to logout the user
  router.get("/" + REPLACEME_REVOCATION_ROUTE, async (req, res) => {
    if (!req.session.user_info) throw new Error(); // TODO externalize session retreival
    const revocationRequest = RevocationRequest(
      configuration,
      req.session.user_info
    );
    await revocationRequest.execute();
    configuration.callbacks.onLogout(req, res);
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
