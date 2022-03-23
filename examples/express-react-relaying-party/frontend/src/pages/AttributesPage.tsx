import React from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";

const REPLACEME_translate = (text: string) => text;

export function AttributesPage() {
  const user_info = useQuery("user_info", async () => {
    const response = await fetch("/oidc/rp/user_info");
    if (response.status !== 200) throw new Error();
    const data = await response.json();
    return data;
  });
  const navigate = useNavigate();
  const logout = async () => {
    const response = await fetch("/oidc/rp/revocation");
    if (response.status !== 200) throw new Error();
    navigate("/");
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
                      {user_info.data &&
                        Object.entries(user_info.data).map(
                          ([attribute, value]) => {
                            return (
                              <React.Fragment key={attribute}>
                                <dt>{attribute}:</dt>
                                <dd>{String(value)}</dd>
                              </React.Fragment>
                            );
                          }
                        )}
                    </dl>
                    <button onClick={logout} className="btn btn-secondary">
                      Log out
                    </button>
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
