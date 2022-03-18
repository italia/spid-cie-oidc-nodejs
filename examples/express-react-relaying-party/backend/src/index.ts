import express from "express";
import { makeDefaultRelayingPartyConfiguration } from "./RelayingPartyConfiguration";
import { RelayingPartyExpressRouter } from "./RelayingPartyExpressRouter";

const PORT = 3000;
const ROUTE = "/oidc/rp/";
const DOMAIN = `http://127.0.0.1:${PORT}`;
const CLIENT_ID = DOMAIN + ROUTE;

const app = express();

app.use(
  ROUTE,
  RelayingPartyExpressRouter(
    // TODO explain that this is only a helper
    // TODO see RelayingPartyConfiguration for more details
    makeDefaultRelayingPartyConfiguration({
      application_name: "My Application",
      contacts: ["me@mail.com"],
      sub: CLIENT_ID,
      trustAnchors: ["http://127.0.0.1:8000/"],
      identityProviders: ["http://127.0.0.1:8000/oidc/op/"],
      // make sure to load this value from filesystem or database, do not commit your cryptographic keys
      publicJWK: {
        kty: "RSA",
        n: "twNBGNSH7okC5pN1xqaBeAutuIjBPvIwQK5DOmIvsTUrMZ53Qi6sbt90_3k7oX6qKg734VRtuaaTSWKAFdbOF9Pd3RVv5-u18zHxsvSTpqmaq33cayB0xwmU69Es9w1rO3jxOWgy56sPnUOYuU7jrH3E7b2NX8P8101JdAJOR4bnipOl8-7gtP7Bhloqa12VcErrtIcYiKxdCVlhweygAbooXK6LxZVsJk3vivPwOQl7Dqcdig-lnG_aao6q4blNTwRbCXB-bsQg8WTu0I1b0NR1HgZHbC1VnIvdIOiGdDlk3IKjsjaaS0mvaS5mSqxRSaOkMk90QfvV3Uwiq25Hww",
        e: "AQAB",
        kid: "GAdluoQoMg8kxPuTE6IqvHWbsDFf6KG2lQT_PwadtHY",
      },
      // make sure to load this value from filesystem or database, do not commit your cryptographic keys
      privateJWK: {
        kty: "RSA",
        n: "twNBGNSH7okC5pN1xqaBeAutuIjBPvIwQK5DOmIvsTUrMZ53Qi6sbt90_3k7oX6qKg734VRtuaaTSWKAFdbOF9Pd3RVv5-u18zHxsvSTpqmaq33cayB0xwmU69Es9w1rO3jxOWgy56sPnUOYuU7jrH3E7b2NX8P8101JdAJOR4bnipOl8-7gtP7Bhloqa12VcErrtIcYiKxdCVlhweygAbooXK6LxZVsJk3vivPwOQl7Dqcdig-lnG_aao6q4blNTwRbCXB-bsQg8WTu0I1b0NR1HgZHbC1VnIvdIOiGdDlk3IKjsjaaS0mvaS5mSqxRSaOkMk90QfvV3Uwiq25Hww",
        e: "AQAB",
        d: "XZ8mkAM5PoeMmlPZLjRDixu-VOZwpTjUAmKjNZzA9RBT9mAwdgTWZSme-ooUPTtE5Zsep4C_WPej5SikiYeHipzxpIWw552nSK_GC1wepGWjIBOUzKCf3KpEKpapQAD3WEc4b7ukPus9Y6AO4s0-nyD_uvb6-YCTObjp2JTNYrz7wQDKTtFYr8U9lms9XccCx-ekaSJx__5DtbxnlLQSWnrA1l3RJ1EehB3fA_-eK1Z6miNzi4VZJYG9JivP0RPZnQ7JXmwXcX5pW-4UdmLrh8YVsZBk_jrwNI-Uo92ClaT30-03eUX8OPf9kOgdUZ1AG_8ZkOqmFJOww5HCQ-OBwQ",
        p: "8NezN5kce-7ro1gnjaZ1tfJLAaRyX_jFW0G2o5305wVAHrw7bwUVcjKtsIjJsX5O3lHDFFMANYiAMc7cU6clXrp7L9aO97e_8qbfhzqLPgRSilXxIpmXGS_z8oxxudmkMSupfOByQw3qg1jVm0WfeKlaxHoHM6D0DGJyHWG7bdE",
        q: "wofWODRHVUOvaeZ5sEs_jxwuVoRG6RO51d-kWfrjrZL0tJHn7e95QhITKEEr3NCneixX65iEhWQDrMNGDIsT43SZfa_5zy6ztSNK1aVQtJJDmOWxnRz9wn-fpmFwqBSPwQIxWbdhrIpTCtNicWwtArSaI1u0EDFpPbApSD3pHVM",
        dp: "MqIGaX_k_yEhpPuZhSwjvxarMjMyYH7abu8HyKoinJb7_fowvIxjD9kbrutzC7-0MQUbcCBrANYrrU0CAQw4zQuDbnE7KVUWI5t1juZ985HREIg048NKgt8T-EASgLIC1NuLDFfbbcF1Nhvs_HHMrv9bt8a30ODbrebcetTbJKE",
        dq: "gHmcBmSok-xu5n8b8U3RPV_8TpFwD7FCc7kPX4nuYo2C5drTFXaqW_N6CYT5Rg3b_jlZG7UQGNTUBH63PcOAsCEq2jKlxqpub3xOiUl0Qr2yvUE-C6jBA3qsYwNJlwh1ZKBhHYKalIyKicTP6F7sXzQN9Lo08tjfS6mTqi2RTxc",
        qi: "uqAIHIcmSdkbTMPtI5uJ8xGZezkh1a7cjz2Veq1vPnfsAsAO7Kr7NC6R1Tny6HP8QKcxSVgtZ95GsZzS3fvuis4pwjAmyEPE1dJl_JXcHwPY2-zOPe6oltAPDC1IGuTiS0WGQnm0D-IdpXQFGo0JL1K8I0wC7XmeT5umkcKJ51E",
        kid: "GAdluoQoMg8kxPuTE6IqvHWbsDFf6KG2lQT_PwadtHY",
      },
      // you obtain these during onboarding process
      // TODO explain better
      trustMarks: [
        {
          id: "https://www.spid.gov.it/openid-federation/agreement/sp-public/",
          trust_mark:
            "eyJhbGciOiJSUzI1NiIsImtpZCI6IkZpZll4MDNibm9zRDhtNmdZUUlmTkhOUDljTV9TYW05VGM1bkxsb0lJcmMiLCJ0eXAiOiJ0cnVzdC1tYXJrK2p3dCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvIiwic3ViIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL29pZGMvcnAvIiwiaWF0IjoxNjQ3NTk5MzExLCJpZCI6Imh0dHBzOi8vd3d3LnNwaWQuZ292Lml0L2NlcnRpZmljYXRpb24vcnAiLCJtYXJrIjoiaHR0cHM6Ly93d3cuYWdpZC5nb3YuaXQvdGhlbWVzL2N1c3RvbS9hZ2lkL2xvZ28uc3ZnIiwicmVmIjoiaHR0cHM6Ly9kb2NzLml0YWxpYS5pdC9pdGFsaWEvc3BpZC9zcGlkLXJlZ29sZS10ZWNuaWNoZS1vaWRjL2l0L3N0YWJpbGUvaW5kZXguaHRtbCJ9.cfFwgKnc3mneoxxDqhfT22YpJL-9Qv8PlhhI80iJClRFxhcwiUV0RMRpgzs3PAF4kQBuGmEyGbXhsJx1HzJpJ1AlH5alJ8xQz3xjqst6HbJtOtsjITXuTaw7f49nMIil2xxVzp5b2GvTql11YtZyvlY6NX4LtaNL6L93xPfvEeEzj_HzZvGZKCAE8Npl5uxmDY0pkv6IzE7BzQfeDWrQ8otxA8-44i8Nacxg90PQ-liXKojJrsK4ZUPYX_6WRWOyAsgqA0_i_-ZMPpQlXLi47dJhn2Dea-TAjEkGXMf24hUkV7XEwzvcSbOdsVSreZ5U4_9EYSxHzZU5DLEBDZAo0Q",
        },
      ],
    })
  )
);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
