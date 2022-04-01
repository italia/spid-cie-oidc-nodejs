import React from "react";
import "../components/access-button.css";
import spidButtonIcon from "../components/spid-ico-circle-bb.svg";
import cieButtonIcon from "../components/cie-ico-circle-bb.svg";
import itProviderIcon from "../components/spid-logo.svg";
import { useQuery } from "react-query";
import { FormattedMessage } from "react-intl";

type AvailableProviders = Record<string, Array<Provider>>;
type Provider = { sub: string; organization_name: string; logo_uri?: string };

export function LandingPage() {
  const providers = useQuery("providers", async () => {
    const response = await fetch("/oidc/rp/providers");
    if (response.status !== 200) throw new Error();
    return (await response.json()) as AvailableProviders;
  });

  const [isSpidButtonOpen, setIsSpidButtonOpen] = React.useState(false);

  return (
    <div className="container pt-2 p-3">
      <div className="row d-lg-flex">
        <div className="col-12">
          <div className="card-wrapper card-space">
            <div className="card card-bg no-after">
              <div className="card-body pl-lg-0">
                <div className="row h-100">
                  <div className="col-12 pl-lg-4">
                    <div className="row p-3">
                      <h3 className="text-left">
                        <FormattedMessage id="welcome" />
                      </h3>
                      <p className="card-title">
                        <FormattedMessage id="spid-explanation" />
                      </p>
                      <p className="card-title">
                        <FormattedMessage id="cie-explanation" />
                      </p>
                    </div>
                    <div className="row mt-3">
                      <div className="col">
                        <span className="badge badge-grey-unical square-corners mb-3 mr-2 ml-0 pr-10 p-2 mw-100">
                          <button
                            id="spid-idp"
                            type="button"
                            className="italia-it-button italia-it-button-size-m button-spid"
                            aria-expanded={isSpidButtonOpen}
                            aria-haspopup="menu"
                            aria-controls="spid-idp-list-medium-root-get"
                            onClick={() =>
                              setIsSpidButtonOpen(!isSpidButtonOpen)
                            }
                          >
                            <span className="italia-it-button-icon">
                              <img src={spidButtonIcon} alt="" />
                            </span>
                            <span className="italia-it-button-text">
                              <FormattedMessage id="login-with-spid" />
                            </span>
                          </button>

                          <div
                            id="spid-idp-button-medium-get"
                            className="spid-idp-button spid-idp-button-tip spid-idp-button-relative"
                            style={{
                              display: isSpidButtonOpen ? "block" : "none",
                            }}
                          >
                            <ul
                              id="spid-idp-list-medium-root-get"
                              role="menu"
                              className="spid-idp-button-menu"
                              aria-orientation="vertical"
                              aria-labelledby="spid-idp"
                              style={{
                                display: isSpidButtonOpen ? "block" : "none",
                              }}
                            >
                              {providers.data?.spid?.map((provider) => {
                                return (
                                  <li
                                    key={provider.sub}
                                    role="presentation"
                                    className="spid-idp-button-link"
                                  >
                                    <a
                                      role="menuitem"
                                      href={`/oidc/rp/authorization?${new URLSearchParams(
                                        { provider: provider.sub }
                                      )}`}
                                    >
                                      <span className="spid-sr-only">
                                        {provider.organization_name}
                                      </span>
                                      <img
                                        src={
                                          provider.logo_uri ?? itProviderIcon
                                        }
                                        alt=""
                                      />
                                    </a>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </span>
                        <span className="badge badge-grey-unical square-corners mb-3 mr-2 ml-0 pr-10 p-2 mw-100">
                          <a
                            href="#"
                            className="italia-it-button italia-it-button-size-m button-cie"
                          >
                            <span className="italia-it-button-icon">
                              <img src={cieButtonIcon} alt="" />
                            </span>
                            <span className="italia-it-button-text">
                              <FormattedMessage id="login-with-cie" />
                            </span>
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
