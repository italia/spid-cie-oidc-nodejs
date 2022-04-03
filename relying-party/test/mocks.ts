import { consoleLogger, createInMemoryAsyncStorage, noopLogger } from "../src";
import { ConfigurationFacadeOptions, HttpClient, JWKs } from "../src/configuration";
import { createJWS, makeExp, makeIat, undiciHttpClient } from "../src/utils";

const mockRelyingPartyPublicJWKs: JWKs = {
  keys: [
    {
      kty: "RSA",
      n: "n4Gsk7F-xieERjWi732gHaGxpqWEpxlUbdTKjdA9y0nimjEXGLrsPGTqb9yYgOQ_RybOH2wZHqLKuXX7XSFAtZKdw7PL9THC_bPPkBtufy_wExscJr-LS-5hmhYJjeNpOsgUvEp-d1pG5l5OMmSziV6-o_MHWuRZivozAV3dItbRGIS6dYk6_8Jvyd2IHZL9YtwqH7n1B9DeerMvvSZEQaHT2d2ErREBbxsyP5dI4EJbPQJ1rUhZ2QyaZ_AlPkBrDOqo4gdpnRx2_Xcxd0pi-NLjvSY9edK62szo4xs8CQ0e3eBvJbsvsail893yC4_6LbdxBNYvw0UrtpyUyuyhUw",
      e: "AQAB",
      kid: "gyVi-fANrEzfZaKLrMSiMBgnQcrfQV-gGuM1cmFHX_c",
    },
  ],
};

const mockRelyingPartyPrivateJWKs: JWKs = {
  keys: [
    {
      kty: "RSA",
      n: "n4Gsk7F-xieERjWi732gHaGxpqWEpxlUbdTKjdA9y0nimjEXGLrsPGTqb9yYgOQ_RybOH2wZHqLKuXX7XSFAtZKdw7PL9THC_bPPkBtufy_wExscJr-LS-5hmhYJjeNpOsgUvEp-d1pG5l5OMmSziV6-o_MHWuRZivozAV3dItbRGIS6dYk6_8Jvyd2IHZL9YtwqH7n1B9DeerMvvSZEQaHT2d2ErREBbxsyP5dI4EJbPQJ1rUhZ2QyaZ_AlPkBrDOqo4gdpnRx2_Xcxd0pi-NLjvSY9edK62szo4xs8CQ0e3eBvJbsvsail893yC4_6LbdxBNYvw0UrtpyUyuyhUw",
      e: "AQAB",
      d: "bfm4hXSB1hn053ufxcQ2G3gaxq2kkpmyTq_CoJiNopZkuK9UH2bx7ood4daVB3lX77TftWaQw0C2ybyA_SsqNIbMY9yZqYsPyGCroc5oFyV0P5gXhtfWMRpBDT5YhA3hxfeh5FjwbVY_QCKRg8lOyE4c32l3DsIWwu3TMQQIrjWb5eSr0evLHwvstnWxG6gfNe3MzzyNWtPeIJs-U-fPX42310izD8g720AtzyXgSHaSAP3nDZjkEH9qky4l2WpsXXne0sgQ5Jkng0coJFKwBHiavIy5L_OC3BxrzlQsH44yLuUDFuSCbiGvkBPHIQCHengVBCoQ0H5CeYe6jRzlQQ",
      p: "zviMsDvk7tik_G_810HggRMH4T0e6bNE92Ul8nIscGtFml-_msPpZKjC6ySGJKKHwyNgyIGiHPOWhhwOvTeIYepjW4uFLEsOXnyApJ7hWwk3g21i0MK4gnwQZzrx7vaFJyKwZsq-EpWpRtL_fm5bPWugZra4xxz2nl3Mt8GJdlE",
      q: "xUq3ovC06f_Y7wmYfhaCWMn-Zcu-UGslEabf55oNw0CgghpJun_WbaEwwsC3Pr4GOb0O6vYCTb-4h3jZUlGRzmsiyJqDFHIweSGwUB1MNuhRT3HQ4EDH36aioIeKJ8imzPkvDAQPXEDJ2JA-mWMUiDX_KFSrW3f1CyTtKi8t4GM",
      dp: "DMl8X7MDnOITp2j_1QjD5xWW6gqNq2ChBSvhoU3-gt-NyFDcFKK_-7EVgdOa2g6UlrDL3PdtXZ6LETQQkQ4qRepmQxSmoKruc1X72K_cOnSiUmNitIUjQySJGuegZOQkK9vPzDoAbkOC1tZYZKZKysuoeFAXsG2Qqw4ehMfXR1E",
      dq: "PqDNUogepfl1n8voAH6cuhrFCwN2Uojwp33VreuVWtn1GdfGd9GE_CAjHm-Wu_AOgd2mEqgtawjlRvvx4NPL-T7BN_T0j1UAVjN_iK8ENpng1dtHdyiZSkHXdiYQkTh82qxvZt0TEzHt4TVI6eAt8F9TtDXMf6jAvNzn_HAlnAk",
      qi: "TLhgQAxHSLHdFmoywnWBOHWR_CwbHfYFyzbu5Pkmr7rqEx3_HLRUcrnYZGm2rF73L7K8Y6xXAjnQJnVdiozrBuz7-Xv0Nkqgl2kvG4vLR4mlRhXU7pcp3a9MhLFuylz8kLsF1TaozkMEIrw5fhwT8leWG84fPBF9aCOQjKdIYOc",
      kid: "gyVi-fANrEzfZaKLrMSiMBgnQcrfQV-gGuM1cmFHX_c",
    },
  ],
};

const mockIdentityProviderPublicJWKs: JWKs = mockRelyingPartyPublicJWKs ?? {
  keys: [
    {
      kty: "RSA",
      e: "AQAB",
      n: "5s4qi1Ta-sEuKb5rJ8TzHmyGKaSu89pIXIi6w4Ekx6GL56mJDNE_MWJHsFjWXajfMdMQmZrSXAvLtXxmbhUui9Mq_IormhmEyyEJS0SyE9UKTxWzi0yd_n_C7OjFBhM-0ZyUlgl81E_sr-35P1A6b5WSYwMvRSR-P9yx_NI-XBQ48G_zdmk3CbuuzZsXZqqgj5U7OGWH-4Huosn9nH3FVkwX0OlWkgWM-J9DEWzGBjl9hfbbrMtM_obljHL2NfT6RJYER2IpdI8RCyQS3sMPt6ZHDskmuNlyMDNATCChXQJLnltwEjxcgvzjw_G9J25DwfdfVEhDF_0kCp44UMmS3Q",
      kid: "2HnoFS3YnC9tjiCaivhWLVUJ3AxwGGz_98uRFaqMEEs",
    },
  ],
};

const mockIdentityProviderPrivateJWKs: JWKs = mockRelyingPartyPrivateJWKs ?? {
  keys: [
    {
      kty: "RSA",
      kid: "2HnoFS3YnC9tjiCaivhWLVUJ3AxwGGz_98uRFaqMEEs",
      n: "5s4qi1Ta-sEuKb5rJ8TzHmyGKaSu89pIXIi6w4Ekx6GL56mJDNE_MWJHsFjWXajfMdMQmZrSXAvLtXxmbhUui9Mq_IormhmEyyEJS0SyE9UKTxWzi0yd_n_C7OjFBhM-0ZyUlgl81E_sr-35P1A6b5WSYwMvRSR-P9yx_NI-XBQ48G_zdmk3CbuuzZsXZqqgj5U7OGWH-4Huosn9nH3FVkwX0OlWkgWM-J9DEWzGBjl9hfbbrMtM_obljHL2NfT6RJYER2IpdI8RCyQS3sMPt6ZHDskmuNlyMDNATCChXQJLnltwEjxcgvzjw_G9J25DwfdfVEhDF_0kCp44UMmS3Q",
      e: "AQAB",
      d: "kXg7xFmVMxpy2AiWTRiLCw_nd3O-eR-JIBllbTeGUPR202o9YQC5TYzeFj3HznxTQHoBKm80SqN8n0Rq4tMi5SoRG96SIKwY0FZgHzqK6okJ2FKbOR7vLaqk1uDW3T9gBokj9XTBYqeFTFU3FTqhuhaRjypArtmTYPjejbSNbUZ29r2UjlMY92y-w4-IVDD9cWlI5I75QA1iWrmPF2t80uk9qqZFde8ZwWsvqqJym-I-x7T34SfMVhJQPbts6VzsUFAUZbT6kVKuUzffSdnr-QeQgj2dR-ULjcN3Y_M-6oc_n25Cz_xFgv3_3hLveizP6inooBzyhgTD1nlR7cWNgQ",
      p: "_XLjTNHt1OfGbaHae50Sm_C4dWp_fNNt1__cUNJ62bxJgFG3KlnwbRWtztXGe-BThMyMXK1HHjjUCf66FQGmfoDYTe7qz9j0OBctKMdkoAjTTYZdOYXu3G9U3HddnB-6bnd8fNnKidGAiseWi1eCoViEqeZ7cVULeOlI-ZOB500",
      q: "6SDtrFt50EL37kgcaKVttxXjz7JbanH5q-mLgV_tzBcdjEeg1lSv9-7pRDPNedF7KD-FsaT-2YSrPrc2F8z6_aKE7M_TCUv-m2LdLbvvB0iqO_kOjkdd1v9I-3qOq3Yvvd_SYTb81uAFTEFeRXoE7sLINOCO8ClCWa95nEFOMdE",
    },
  ],
};

const mockTrustAnchorPublicJWKs: JWKs = mockRelyingPartyPublicJWKs ?? {
  keys: [
    {
      kty: "RSA",
      e: "AQAB",
      n: "3i5vV-_4nF_ES1BU86Zf2Bj6SiyGdGM3Izc2GrvtknQQCzpT3QlGv2d_wMrzVTS7PmZlvjyi2Qceq8EmEwbsIa5R8G57fxSpE0HL33giJfhpe8ublY4hGb6tEqSbHiFcgiF4T-Ft_98pz4nZtKTcesMZ8CcDUd9ibaLXGM4vaiUhSt76X1qOzqJHqAKMG-9VGm5DD2GSe7cu1yvaMCMPU6DGOqHYoBSkSbsnLelsRg6sINh6mZfb39odTJlOMFGhlg665702kc_iqqxd8jpyOh94vBagmJB4EQqI1qEte8sTMeBkVRpSLDoV5uNTlp2ZdINu1SakmaHB3WeStwC1lw",
      kid: "FifYx03bnosD8m6gYQIfNHNP9cM_Sam9Tc5nLloIIrc",
    },
  ],
};

const mockTrustAnchorPrivateJWKs: JWKs = mockRelyingPartyPrivateJWKs ?? {
  keys: [
    {
      kty: "RSA",
      kid: "FifYx03bnosD8m6gYQIfNHNP9cM_Sam9Tc5nLloIIrc",
      e: "AQAB",
      n: "3i5vV-_4nF_ES1BU86Zf2Bj6SiyGdGM3Izc2GrvtknQQCzpT3QlGv2d_wMrzVTS7PmZlvjyi2Qceq8EmEwbsIa5R8G57fxSpE0HL33giJfhpe8ublY4hGb6tEqSbHiFcgiF4T-Ft_98pz4nZtKTcesMZ8CcDUd9ibaLXGM4vaiUhSt76X1qOzqJHqAKMG-9VGm5DD2GSe7cu1yvaMCMPU6DGOqHYoBSkSbsnLelsRg6sINh6mZfb39odTJlOMFGhlg665702kc_iqqxd8jpyOh94vBagmJB4EQqI1qEte8sTMeBkVRpSLDoV5uNTlp2ZdINu1SakmaHB3WeStwC1lw",
      d: "QvPRP7mjvFOrjlp9zxJyzWbxfYqfVdFUGzuXBUVeWQS6lPeVsAUMmb8xo0JFQ4bpaetne4VAOZBIsM86jv9GBvxF2uMgOfJa5N-t9QB5oeGSv-hiURYMaXqpIvYRfGnnO5ukasXu5O0150GOJj6L5j6GwXSwLmrXeVxZ3zK63QwVl71xU1LR-lO0wLbqQROIT37Jw72B__wBk3QC0HjbrPv1fUVxKB3RCDR43X7PQkMPOfRHxicyp2MA4mLhLvuoRTTI4dfnd8Ou-xX5ctVzYmL0EMxPCleDFDIn9gTxpgCH95sVi-Zg6Zw5k1J_cchoD4AgGSSt2dr9mbiTRjLlcQ",
      p: "8BHX7hErQjESybgfzcX0hZmM-e1EWaM76uNJop9BiqRlBz9f-XxuC40A032AaZFDXqxVi3W0Hn1vJA6lSj9mGY5HEY-YVWAdOLLjM12oQ_cnH6czElExAoppUeMWsDEewDbZTn6rX5silcZ8Pu7Tsj-KSjPVzl9dr1w76EzsYj8",
      q: "7Oy3PGm3MjVlgTlgHnRKC-IcoB50hCBiqwACVcnlIgpg9Kt_srV7NWdmo5DJFIdrrvkjmN4wi9IOknSymStU-sB8BepnnterjPyBOr9PbttUP13qcOjuvjzD7Tr0IGou3yhA-YOuO9hOluhqd4tJIkdxT_X9qxgFQx5NSnsBpqk",
    },
  ],
};

function mockRelyingPartyEntityConfiguration() {
  return createJWS(
    {
      iat: makeIat(),
      exp: makeExp(),
      iss: "http://127.0.0.1:3000/oidc/rp/",
      sub: "http://127.0.0.1:3000/oidc/rp/",
      jwks: mockRelyingPartyPublicJWKs,
      metadata: {
        openid_relying_party: {
          application_type: "web",
          client_id: "http://127.0.0.1:3000/oidc/rp/",
          client_registration_types: ["automatic"],
          jwks: mockRelyingPartyPublicJWKs,
          client_name: "My Application",
          contacts: undefined,
          grant_types: ["refresh_token", "authorization_code"],
          redirect_uris: ["http://127.0.0.1:3000/oidc/rp/callback"],
          response_types: ["code"],
          subject_type: "pairwise",
        },
      },
      trust_marks: [],
      authority_hints: ["http://127.0.0.1:8000/"],
    },
    mockRelyingPartyPrivateJWKs.keys[0]
  );
}

function mockIdentityProviderEntityConfiguration() {
  return createJWS(
    {
      exp: makeExp(),
      iat: makeIat(),
      iss: "http://127.0.0.1:8000/oidc/op/",
      sub: "http://127.0.0.1:8000/oidc/op/",
      jwks: mockIdentityProviderPublicJWKs,
      metadata: {
        openid_provider: {
          authorization_endpoint: "http://127.0.0.1:8000/oidc/op/authorization",
          revocation_endpoint: "http://127.0.0.1:8000/oidc/op/revocation/",
          id_token_encryption_alg_values_supported: ["RSA-OAEP"],
          id_token_encryption_enc_values_supported: ["A128CBC-HS256"],
          op_name: "Agenzia per l\u2019Italia Digitale",
          op_uri: "https://www.agid.gov.it",
          token_endpoint: "http://127.0.0.1:8000/oidc/op/token/",
          userinfo_endpoint: "http://127.0.0.1:8000/oidc/op/userinfo/",
          introspection_endpoint: "http://127.0.0.1:8000/oidc/op/introspection/",
          claims_parameter_supported: true,
          contacts: ["ops@https://idp.it"],
          client_registration_types_supported: ["automatic"],
          code_challenge_methods_supported: ["S256"],
          request_authentication_methods_supported: { ar: ["request_object"] },
          acr_values_supported: [
            "https://www.spid.gov.it/SpidL1",
            "https://www.spid.gov.it/SpidL2",
            "https://www.spid.gov.it/SpidL3",
          ],
          claims_supported: [
            "https://attributes.spid.gov.it/spidCode",
            "https://attributes.spid.gov.it/name",
            "https://attributes.spid.gov.it/familyName",
            "https://attributes.spid.gov.it/placeOfBirth",
            "https://attributes.spid.gov.it/countyOfBirth",
            "https://attributes.spid.gov.it/dateOfBirth",
            "https://attributes.spid.gov.it/gender",
            "https://attributes.spid.gov.it/companyName",
            "https://attributes.spid.gov.it/registeredOffice",
            "https://attributes.spid.gov.it/fiscalNumber",
            "https://attributes.spid.gov.it/ivaCode",
            "https://attributes.spid.gov.it/idCard",
            "https://attributes.spid.gov.it/mobilePhone",
            "https://attributes.spid.gov.it/email",
            "https://attributes.spid.gov.it/address",
            "https://attributes.spid.gov.it/expirationDate",
            "https://attributes.spid.gov.it/digitalAddress",
          ],
          grant_types_supported: ["authorization_code", "refresh_token"],
          id_token_signing_alg_values_supported: ["RS256", "ES256"],
          issuer: "http://127.0.0.1:8000/oidc/op/",
          jwks: mockIdentityProviderPublicJWKs,
          scopes_supported: ["openid", "offline_access"],
          logo_uri: "http://127.0.0.1:8000/static/svg/spid-logo-c-lb.svg",
          organization_name: "SPID OIDC identity provider",
          op_policy_uri: "http://127.0.0.1:8000/oidc/op/en/website/legal-information/",
          request_parameter_supported: true,
          request_uri_parameter_supported: true,
          require_request_uri_registration: true,
          response_types_supported: ["code"],
          subject_types_supported: ["pairwise", "public"],
          token_endpoint_auth_methods_supported: ["private_key_jwt"],
          token_endpoint_auth_signing_alg_values_supported: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
          userinfo_encryption_alg_values_supported: [
            "RSA-OAEP",
            "RSA-OAEP-256",
            "ECDH-ES",
            "ECDH-ES+A128KW",
            "ECDH-ES+A192KW",
            "ECDH-ES+A256KW",
          ],
          userinfo_encryption_enc_values_supported: [
            "A128CBC-HS256",
            "A192CBC-HS384",
            "A256CBC-HS512",
            "A128GCM",
            "A192GCM",
            "A256GCM",
          ],
          userinfo_signing_alg_values_supported: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
          request_object_encryption_alg_values_supported: [
            "RSA-OAEP",
            "RSA-OAEP-256",
            "ECDH-ES",
            "ECDH-ES+A128KW",
            "ECDH-ES+A192KW",
            "ECDH-ES+A256KW",
          ],
          request_object_encryption_enc_values_supported: [
            "A128CBC-HS256",
            "A192CBC-HS384",
            "A256CBC-HS512",
            "A128GCM",
            "A192GCM",
            "A256GCM",
          ],
          request_object_signing_alg_values_supported: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
        },
      },
      authority_hints: ["http://127.0.0.1:8000/"],
    },
    mockIdentityProviderPrivateJWKs.keys[0]
  );
}

function mockTrustAnchorEntityConfiguration() {
  return createJWS(
    {
      exp: makeExp(),
      iat: makeIat(),
      iss: "http://127.0.0.1:8000/",
      sub: "http://127.0.0.1:8000/",
      jwks: mockTrustAnchorPublicJWKs,
      metadata: {
        federation_entity: {
          contacts: ["ops@localhost"],
          federation_fetch_endpoint: "http://127.0.0.1:8000/fetch/",
          federation_resolve_endpoint: "http://127.0.0.1:8000/resolve/",
          federation_status_endpoint: "http://127.0.0.1:8000/trust_mark_status/",
          homepage_uri: "http://127.0.0.1:8000",
          name: "example TA",
          federation_list_endpoint: "http://127.0.0.1:8000/list/",
        },
      },
      trust_marks_issuers: {
        "https://www.spid.gov.it/certification/rp/public": [
          "https://registry.spid.agid.gov.it",
          "https://public.intermediary.spid.it",
        ],
        "https://www.spid.gov.it/certification/rp/private": [
          "https://registry.spid.agid.gov.it",
          "https://private.other.intermediary.it",
        ],
        "https://sgd.aa.it/onboarding": ["https://sgd.aa.it"],
      },
      constraints: { max_path_length: 1 },
    },
    mockTrustAnchorPrivateJWKs.keys[0]
  );
}

function mockRelyingPartyEntityStatement() {
  return createJWS(
    {
      exp: makeExp(),
      iat: makeIat(),
      iss: "http://127.0.0.1:8000/",
      sub: "http://127.0.0.1:3000/oidc/rp/",
      jwks: mockRelyingPartyPublicJWKs,
      metadata_policy: {
        openid_relying_party: {
          grant_types: {
            subset_of: ["authorization_code", "refresh_token"],
          },
          scopes: {
            superset_of: ["openid"],
            subset_of: ["openid", "offline_access"],
          },
        },
      },
      trust_marks: [
        {
          id: "https://www.spid.gov.it/openid-federation/agreement/sp-public/",
          trust_mark:
            "eyJhbGciOiJSUzI1NiIsImtpZCI6IkZpZll4MDNibm9zRDhtNmdZUUlmTkhOUDljTV9TYW05VGM1bkxsb0lJcmMiLCJ0eXAiOiJ0cnVzdC1tYXJrK2p3dCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvIiwic3ViIjoiaHR0cDovLzEyNy4wLjAuMTozMDAwL29pZGMvcnAvIiwiaWF0IjoxNjQ5MDA3NDI3LCJpZCI6Imh0dHBzOi8vd3d3LnNwaWQuZ292Lml0L2NlcnRpZmljYXRpb24vcnAiLCJtYXJrIjoiaHR0cHM6Ly93d3cuYWdpZC5nb3YuaXQvdGhlbWVzL2N1c3RvbS9hZ2lkL2xvZ28uc3ZnIiwicmVmIjoiaHR0cHM6Ly9kb2NzLml0YWxpYS5pdC9pdGFsaWEvc3BpZC9zcGlkLXJlZ29sZS10ZWNuaWNoZS1vaWRjL2l0L3N0YWJpbGUvaW5kZXguaHRtbCJ9.u5AhuPcfRTJvT57tiT9apYSnI2c1hFXSok7N0Z3PjSA-_UKHZwi0ml8fr22ptE59F7gMcXyM-NTpAkQEuTxzZi3xRdZD2E1qGrdADTEaVxL4LOSPZdusKygT4HzdmTvE7Oo-9OkP9Qmu3oH6sMMIhqnVNgvlkbK6ivbtbgdLIxiTdwiK9bLkJ37dYc5aE9CuQqxGkxqXkYSeB-MmVIx1urW4Rn3QUXyT_dwaLjP7G5KOxUrUilWXJMWEu-s2v2WUzFkTSaP4wT83-Hym7_av9omc3mMlHNmrjBxaK0sjTaL73J69izFWAbUj0WpgbVm5kwor57YD9lB51tVsXMbmIg",
        },
      ],
    },
    mockTrustAnchorPrivateJWKs.keys[0]
  );
}

function mockIdentityProviderEntityStatement() {
  return createJWS(
    {
      exp: makeExp(),
      iat: makeIat(),
      iss: "http://127.0.0.1:8000/",
      sub: "http://127.0.0.1:8000/oidc/op/",
      jwks: {
        keys: [
          {
            kty: "RSA",
            n: "01_4aI2Lu5ggsElmRkE_S_a83V_szXU0txV4db2hmJ8HR1Y2s7PsZZ5-emGpnTydGrR3n-QExeEEIcFt_a06Ryiink34RQcKoGXUDBMBU0Bu8G7NcZ99YX6yeG9wFi4xs-WviTPmtPqijkz6jm1_ltWDcwbktfkraIRKKggZaEl9ldtsFr2wSpin3AXuGIdeJ0hZqhF92ODBLGjJlaIL9KlwopDy56adReVnraawSdrxmuPGj78IEADNAme2nQNvv9UCu0FkAn5St1bKds3Gpv26W0kjr1gZLsmQrj9lTcDk_KbAwfEY__P7se62kusoSuKMTQqUG1TQpUY7oFGSdw",
            e: "AQAB",
            kid: "dB67gL7ck3TFiIAf7N6_7SHvqk0MDYMEQcoGGlkUAAw",
          },
        ],
      },
      metadata_policy: {
        openid_provider: {
          subject_types_supported: {
            value: ["pairwise"],
          },
          id_token_signing_alg_values_supported: {
            subset_of: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
          },
          userinfo_signing_alg_values_supported: {
            subset_of: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
          },
          token_endpoint_auth_methods_supported: {
            value: ["private_key_jwt"],
          },
          userinfo_encryption_alg_values_supported: {
            subset_of: ["RSA-OAEP", "RSA-OAEP-256", "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW"],
          },
          userinfo_encryption_enc_values_supported: {
            subset_of: ["A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512", "A128GCM", "A192GCM", "A256GCM"],
          },
          request_object_encryption_alg_values_supported: {
            subset_of: ["RSA-OAEP", "RSA-OAEP-256", "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW"],
          },
          request_object_encryption_enc_values_supported: {
            subset_of: ["A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512", "A128GCM", "A192GCM", "A256GCM"],
          },
          request_object_signing_alg_values_supported: {
            subset_of: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
          },
        },
      },
      trust_marks: [
        {
          id: "https://www.spid.gov.it/openid-federation/agreement/op-public/",
          trust_mark:
            "eyJhbGciOiJSUzI1NiIsImtpZCI6IkZpZll4MDNibm9zRDhtNmdZUUlmTkhOUDljTV9TYW05VGM1bkxsb0lJcmMiLCJ0eXAiOiJ0cnVzdC1tYXJrK2p3dCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvIiwic3ViIjoiaHR0cDovLzEyNy4wLjAuMTo4MDAwL29pZGMvb3AvIiwiaWF0IjoxNjQ5MDA3OTUwLCJpZCI6Imh0dHBzOi8vd3d3LnNwaWQuZ292Lml0L2NlcnRpZmljYXRpb24vb3AiLCJtYXJrIjoiaHR0cHM6Ly93d3cuYWdpZC5nb3YuaXQvdGhlbWVzL2N1c3RvbS9hZ2lkL2xvZ28uc3ZnIiwicmVmIjoiaHR0cHM6Ly9kb2NzLml0YWxpYS5pdC9pdGFsaWEvc3BpZC9zcGlkLXJlZ29sZS10ZWNuaWNoZS1vaWRjL2l0L3N0YWJpbGUvaW5kZXguaHRtbCJ9.x5R6MuLG0l1q3z4hOPisGoyeBZwd9Xh4bMbVl1ta10MEFjDjGluk4Tjv3giCQCpJcE7_Pr9VTeADq4LFvKDn9VXA7XSmmkw4T86HCtxXvXRH-F5v8biQyrdPcTTbaMMtn-nAaOpIlo_aMODzCE0u1QpOt2UI8fXOD1Ev_nktzGZTfk3bCg8VFzQh-5nbkwdIuKmivewQNMZcWNJ-R1HwILsGOBwsjyGueZFcpo9jY1-Vz6wHqllP7ApjYfmLYPU5JpOKTx82mH1uJMQLMCvD7ZJap68Erh25LivSQxP_9OuL57y02zWMdCq9X6RY7wmQ2iZbHNUDzet-bqhc_4s0Rw",
        },
      ],
    },
    mockTrustAnchorPrivateJWKs.keys[0]
  );
}

const mockHttpClient: HttpClient = async (request) => {
  switch (request.url) {
    case "http://127.0.0.1:3000/oidc/rp/.well-known/openid-federation": {
      return {
        status: 200,
        headers: { "content-type": "application/entity-statement+jwt" },
        body: await mockRelyingPartyEntityConfiguration(),
      };
    }
    case "http://127.0.0.1:8000/oidc/op/.well-known/openid-federation": {
      return {
        status: 200,
        headers: { "content-type": "application/entity-statement+jwt" },
        body: await mockIdentityProviderEntityConfiguration(),
      };
    }
    case "http://127.0.0.1:8000/.well-known/openid-federation": {
      return {
        status: 200,
        headers: { "content-type": "application/entity-statement+jwt" },
        body: await mockTrustAnchorEntityConfiguration(),
      };
    }
    case "http://127.0.0.1:8000/fetch/?sub=http://127.0.0.1:3000/oidc/rp/": {
      return {
        status: 200,
        headers: { "content-type": "application/entity-statement+jwt" },
        body: await mockRelyingPartyEntityStatement(),
      };
    }
    case "http://127.0.0.1:8000/fetch/?sub=http://127.0.0.1:8000/oidc/op/": {
      return {
        status: 200,
        headers: { "content-type": "application/entity-statement+jwt" },
        body: await mockIdentityProviderEntityStatement(),
      };
    }
    default: {
      console.log(request);
      console.dir(await undiciHttpClient(request), { depth: null });
      throw new Error();
    }
  }
};

export const mockConfiguration: ConfigurationFacadeOptions = {
  client_id: `http://127.0.0.1:3000/oidc/rp/`,
  client_name: "My Application",
  trust_anchors: ["http://127.0.0.1:8000/"],
  identity_providers: {
    spid: ["http://127.0.0.1:8000/oidc/op/"],
    cie: [],
  },
  logger: noopLogger ?? consoleLogger,
  auditLogger: () => {},
  storage: createInMemoryAsyncStorage(),
  httpClient: mockHttpClient,
  public_jwks: mockRelyingPartyPublicJWKs,
  private_jwks: mockRelyingPartyPrivateJWKs,
};
