import React from "react";

const REPLACEME_translate = (text: string) => text;
const REPLACEME_url = (src: string) => src;

export function AttributesPage() {
  const oidc_rp_user_attrs: { items: Record<string, string> } = {
    items: {
      sub: "5f32567af7e0e77ea09de8521ae5f6a0fd6984176e99a6bc694a8a0198231dc3",
      username:
        "http://127.0.0.1:8000/oidc/op/__5f32567af7e0e77ea09de8521ae5f6a0fd6984176e99a6bc694a8a0198231dc3",
      first_name: "peppe",
      last_name: "maradona",
      email: "that@ema.il",
      fiscal_number: "8sada89s7da89sd7a98sd78",
    },
  };
  return (
    <div className="container pt-2 p-3">
      <div className="row d-lg-flex">
        <div className="col-12">
          <div className="card-wrapper card-space">
            <div className="card card-bg no-after">
              <div className="card-body pl-lg-0">
                <div className="row h-100">
                  <div className="col-12 pl-lg-4">
                    <h4 className="text-left">
                      {REPLACEME_translate("OIDC attributes")}
                    </h4>

                    <dl>
                      {Object.entries(oidc_rp_user_attrs.items).map(
                        ([attribute, value]) => {
                          return (
                            <React.Fragment key={attribute}>
                              <dt>{attribute}:</dt>
                              <dd>{value}</dd>
                            </React.Fragment>
                          );
                        }
                      )}
                    </dl>

                    <a
                      href={REPLACEME_url("spid_cie_rpinitiated_logout")}
                      className="btn btn-secondary"
                      role="button"
                    >
                      Log out
                    </a>
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
