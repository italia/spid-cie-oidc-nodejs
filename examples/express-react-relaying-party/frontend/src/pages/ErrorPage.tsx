import React from "react";

const REPLACEME_translate = (text: string) => text;

export function ErrorPage() {
  const error = "INVALID_REQUEST"; // TODO
  const error_description = "Authentication request rejected by user"; // TODO
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
                        {REPLACEME_translate(error)}
                      </div>
                      <p>{REPLACEME_translate(error_description)}</p>
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
