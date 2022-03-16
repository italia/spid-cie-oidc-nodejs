import express from "express";
import { createAuthenticationRequest_GET } from "./AuthenticationRequest";
import {
  REPLACEME_ATTRIBUTES_ROUTE,
  REPLACEME_AUTHORIZATION_ROUTE,
  REPLACEME_CALLBACK_ROUTE,
  REPLACEME_LANDING_ROUTE,
  REPLACEME_LOGOUT_ROUTE,
} from "./settings";

const router = express.Router();

// initial page where user lands
// shows buttons to login with various providers
router.get(REPLACEME_LANDING_ROUTE, (req, res) => {
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
router.get(REPLACEME_AUTHORIZATION_ROUTE, async (req, res) => {
  const provider = req.query.provider as string; // TODO validate that is a string
  const scope = req.query.scope as string; // TODO validate that is a string or undefined
  const redirect_uri = req.query.redirect_uri as string; // TODO validate that is a string or undefined
  const acr_values = req.query.acr_values as string; // TODO validate that is a string or undefined
  const prompt = req.query.prompt as string; // TODO validate that is a string or undefined
  const redirectUrl = createAuthenticationRequest_GET({
    provider,
    scope,
    redirect_uri,
    acr_values,
    prompt,
  });
  res.redirect(await redirectUrl);
});

// provider will redirect here after user authenticate and grants access
router.get(REPLACEME_CALLBACK_ROUTE, (req, res) => {});

// show claims (attributes) about the user
router.get(REPLACEME_ATTRIBUTES_ROUTE, (req, res) => {});

router.get(REPLACEME_LOGOUT_ROUTE, (req, res) => {});

export default router;
