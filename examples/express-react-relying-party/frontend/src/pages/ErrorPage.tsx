import React from "react";
import { FormattedMessage } from "react-intl";
import { useSearchParams } from "react-router-dom";

export function ErrorPage() {
  let [searchParams] = useSearchParams();
  const error = searchParams.get("error") ?? "";
  const error_description = searchParams.get("error_description") ?? "";
  return (
    <div className="container pt-2 p-3">
      <div className="row d-lg-flex">
        <div className="col-12">
          <div className="card-wrapper card-space">
            <div className="card card-bg no-after">
              <div className="card-body pl-lg-0">
                <div className="row h-100">
                  <div className="col-12 col-lg-6 pl-lg-4">
                    <div className="callout danger">
                      <div className="callout-title">
                        <FormattedMessage id={error}/>
                      </div>
                      <p>
                        <FormattedMessage id={error_description} />
                      </p>
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
