import * as jose from "jose";
import { RelayingPartyConfiguration } from "./RelayingPartyConfiguration";
import { REPLACEME_CALLBACK_ROUTE } from "./RelayingPartyExpressRouter";

function RelayingPartyEntityConfiguration(
  configuration: RelayingPartyConfiguration
) {
  const iat = Date.now();
  const exp = iat + configuration.federationDefaultExp;
  const iss = configuration.sub;
  const sub = configuration.sub;
  // parent authority
  const authority_hints = configuration.trustAnchors;
  // oidc core public keys
  // TODO support multiple keys
  // TODO use separate keys for core and federation
  const core_jwks = { keys: configuration.publicJWKS };
  // oidc federation public keys
  // use these for federation related operations such as onboarding
  // TODO support multiple keys
  // TODO use separate keys for core and federation
  const federation_jwks = { keys: configuration.publicJWKS };
  // you obtain this fron federation during onbaording process (after relaying party is validated)
  // TODO let it paste
  const trust_marks = [
    {
      id: "https://www.spid.gov.it/openid-federation/agreement/sp-public/",
      trust_mark:
        "eyJhbGciOiJSUzI1NiIsImtpZCI6IkZpZll4MDNibm9zRDhtNmdZUUlmTkhOUDljTV9TYW05VGM1bkxsb0lJcmMifQ.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvIiwic3ViIjoiaHR0cDovLzEyNy4wLjAuMTo4MDAwL29pZGMvcnAvIiwiaWF0IjoxNjQ1NjEyNDAxLCJpZCI6Imh0dHBzOi8vd3d3LnNwaWQuZ292Lml0L2NlcnRpZmljYXRpb24vcnAiLCJtYXJrIjoiaHR0cHM6Ly93d3cuYWdpZC5nb3YuaXQvdGhlbWVzL2N1c3RvbS9hZ2lkL2xvZ28uc3ZnIiwicmVmIjoiaHR0cHM6Ly9kb2NzLml0YWxpYS5pdC9pdGFsaWEvc3BpZC9zcGlkLXJlZ29sZS10ZWNuaWNoZS1vaWRjL2l0L3N0YWJpbGUvaW5kZXguaHRtbCJ9.mSPNR0AOPBn3UNJAIbrWUMQ8vGTetQajpa3i59JDKDXYWqo2TUGh4AQBghCiG3qqV9cl-hleLtuwoeZ1InKHeslTLftVdcR3meeMLs3mLobHYr26Mi7pC7-jx1ZFVyk4GXl7mn9WVSQGEUOiuhL01tdlUfxf0TJSFSOMEZGpCA3hXroLOnEl3FjkAw7sPvjfImsbadbHVusb72HTTs1n5Xo7z3As3fDWHcxD-fvvq0beu9cx-L2sT4YaNC-ELd1M3m5r0NIjjEUAt4Gnot-l5Z3-C_bA41uvh2hX34U_fGZ6jpmuluJo1Lqi26N8LTB-Rbu0UMaZnkRg9E72_YRZig",
    },
  ];
  return {
    iat,
    exp,
    iss,
    sub,
    jwks: core_jwks,
    metadata: {
      openid_relying_party: {
        application_type: configuration.application_type,
        client_id: configuration.sub,
        client_registration_types: ["automatic"],
        jwks: federation_jwks,
        client_name: configuration.application_name,
        contacts: configuration.contacts,
        grant_types: ["refresh_token", "authorization_code"],
        redirect_uris: [configuration.sub + REPLACEME_CALLBACK_ROUTE],
        response_types: configuration.response_types,
        subject_type: "pairwise",
      },
    },
    trust_marks,
    authority_hints,
  };
}

export async function getRelayingPartyEntityConfigurationJWS(configuration: RelayingPartyConfiguration) {
  const entityConfiguration = RelayingPartyEntityConfiguration(configuration);
  // TODO make it configurable
  const jwk = configuration.privateJWKS[0];
  const privateKey = await jose.importJWK(jwk, "RS256");
  const jws = await new jose.CompactSign(
    new TextEncoder().encode(JSON.stringify(entityConfiguration))
  )
    .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
    .sign(privateKey);
  return jws;
}
