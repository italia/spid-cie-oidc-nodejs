import React from "react";
import "../components/access-button.css";
import spidButtonIcon from "../components/spid-ico-circle-bb.svg";
import cieButtonIcon from "../components/cie-ico-circle-bb.svg";
import itProviderIcon from "../components/logo-it.svg";

const REPLACEME_translate = (text: string) => text;
function ReplacemeTranslate(props: { children: React.ReactNode }) {
  return props.children as any;
}
const REPLACEME_url = (src: string) => src;

export function LandingPage() {
  // TODO load from backend
  const providers: Array<{
    sub: string;
    metadata: { organization_name: string };
  }> = [{ sub: "sub", metadata: { organization_name: "organization_name" } }];
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
                        {REPLACEME_translate("Welcome")}
                      </h3>

                      <p className="card-title">
                        <ReplacemeTranslate>
                          SPID is the access system that allows you to use
                          online services with a unique digital identity. If you
                          already have a digital identity, login with your
                          Identity Provider. If you don’t have a digital
                          identity yet, choose an Identity Provider where obtain
                          your SPID Digital Identity.
                        </ReplacemeTranslate>
                      </p>

                      <p className="card-title">
                        <ReplacemeTranslate>
                          If you have the new Electronic Identity Card (CIE) you
                          can use it to access the services online Public
                          Administration. You need the PIN and PUK codes: the
                          first part of the two codes is in the receipt of the
                          CIE request, the second part is delivered together
                          with the CIE. Visit the official site of CIE id to get
                          the software, documentation and tutorial.
                        </ReplacemeTranslate>
                      </p>
                    </div>

                    <div className="row mt-3">
                      <div className="col">
                        <span className="badge badge-grey-unical square-corners mb-3 mr-2 ml-0 pr-10 p-2 mw-100">
                          <a
                            href="#"
                            className="italia-it-button italia-it-button-size-m button-spid"
                            spid-idp-button="#spid-idp-button-medium-get"
                            aria-expanded="false"
                            onClick={() =>
                              setIsSpidButtonOpen(!isSpidButtonOpen)
                            }
                          >
                            <span className="italia-it-button-icon">
                              <img src={spidButtonIcon} alt="" />
                            </span>
                            <span className="italia-it-button-text">
                              {REPLACEME_translate("Entra con SPID")}
                            </span>
                          </a>
                          {isSpidButtonOpen && (
                            <div
                              id="spid-idp-button-medium-get"
                              className="spid-idp-button spid-idp-button-tip spid-idp-button-relative"
                              style={{ display: "block" }}
                            >
                              <ul
                                id="spid-idp-list-medium-root-get"
                                className="spid-idp-button-menu"
                                aria-labelledby="spid-idp"
                              >
                                {providers.map((provider, index) => {
                                  return (
                                    <li
                                      key={index} // TODO use appropriate key
                                      className="spid-idp-button-link"
                                    >
                                      <a
                                        href={`${REPLACEME_url(
                                          "spid_cie_rp_begin"
                                        )}?provider=${provider.sub}`}
                                      >
                                        <span className="spid-sr-only">
                                          {provider.metadata.organization_name}
                                        </span>
                                        <img
                                          src={itProviderIcon}
                                          alt={
                                            provider.metadata.organization_name
                                          }
                                        />
                                      </a>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
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
                              {REPLACEME_translate("Entra con CIE")}
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
