import React from "react";
import sprite from "./sprite.svg";

const REPLACEME_translate = (text: string) => text;

export function Footer() {
  return (
    <footer className="it-footer">
      <div className="it-footer-main">
        <div className="container">
          <section>
            <div className="row clearfix">
              <div className="col-sm-12">
                <div className="it-brand-wrapper">
                  <a href="#">
                    <svg className="icon">
                      <use xlinkHref={sprite + "#it-code-circle"} />
                    </svg>
                    <div className="it-brand-text">
                      <h2 className="no_toc">
                        {REPLACEME_translate("OIDC Relying Party")}
                      </h2>
                      <h3 className="no_toc d-none d-md-block">
                        {REPLACEME_translate("OIDC Relying Party")}
                      </h3>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section>
            <div className="row">
              <div className="col-lg-3 col-md-3 col-sm-6 pb-2">
                <h4>
                  <a href="#" title="Vai alla pagina: Amministrazione">
                    Amministrazione
                  </a>
                </h4>
                <div className="link-list-wrapper">
                  <ul className="footer-list link-list clearfix">
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Giunta e consiglio"
                      >
                        Giunta e consiglio
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Aree di competenza"
                      >
                        Aree di competenza
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Dipendenti"
                      >
                        Dipendenti
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Luoghi"
                      >
                        Luoghi
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Associazioni e società partecipate"
                      >
                        Associazioni e società partecipate
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-3 col-sm-6 pb-2">
                <h4>
                  <a href="#" title="Vai alla pagina: Servizi">
                    Servizi
                  </a>
                </h4>
                <div className="link-list-wrapper">
                  <ul className="footer-list link-list clearfix">
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Pagamenti"
                      >
                        Pagamenti
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Sostegno"
                      >
                        Sostegno
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Domande e iscrizioni"
                      >
                        Domande e iscrizioni
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Segnalazioni"
                      >
                        Segnalazioni
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Autorizzazioni e concessioni"
                      >
                        Autorizzazioni e concessioni
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Certificati e dichiarazioni"
                      >
                        Certificati e dichiarazioni
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-3 col-sm-6 pb-2">
                <h4>
                  <a href="#" title="Vai alla pagina: Novità">
                    Novità
                  </a>
                </h4>
                <div className="link-list-wrapper">
                  <ul className="footer-list link-list clearfix">
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Notizie"
                      >
                        Notizie
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Eventi"
                      >
                        Eventi
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Comunicati stampa"
                      >
                        Comunicati stampa
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-3 col-sm-6">
                <h4>
                  <a href="#" title="Vai alla pagina: Documenti">
                    Documenti
                  </a>
                </h4>
                <div className="link-list-wrapper">
                  <ul className="footer-list link-list clearfix">
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Progetti e attività"
                      >
                        Progetti e attività
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Delibere, determine e ordinanze"
                      >
                        Delibere, determine e ordinanze
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Bandi"
                      >
                        Bandi
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Concorsi"
                      >
                        Concorsi
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Albo pretorio"
                      >
                        Albo pretorio
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
          <section className="py-4 border-white border-top">
            <div className="row">
              <div className="col-lg-4 col-md-4 pb-2">
                <h4>
                  <a href="#" title="Vai alla pagina: Contatti">
                    Contatti
                  </a>
                </h4>
                <p>
                  <strong>Comune di Lorem Ipsum</strong>
                  <br /> Via Roma 0 - 00000 Lorem Ipsum Codice fiscale / P. IVA:
                  000000000
                </p>
                <div className="link-list-wrapper">
                  <ul className="footer-list link-list clearfix">
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: Posta Elettronica Certificata"
                      >
                        Posta Elettronica Certificata
                      </a>
                    </li>
                    <li>
                      <a
                        className="list-item"
                        href="#"
                        title="Vai alla pagina: URP - Ufficio Relazioni con il Pubblico"
                      >
                        URP - Ufficio Relazioni con il Pubblico
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-4 col-md-4 pb-2">
                <h4>
                  <a href="#" title="Vai alla pagina: Lorem Ipsum">
                    Lorem Ipsum
                  </a>
                </h4>
              </div>
              <div className="col-lg-4 col-md-4 pb-2">
                <div className="pb-2">
                  <h4>
                    <a href="#" title="Vai alla pagina: Seguici su">
                      Seguici su
                    </a>
                  </h4>
                  <ul className="list-inline text-left social">
                    <li className="list-inline-item">
                      <a className="p-2 text-white" href="#" target="_blank">
                        <svg className="icon icon-sm icon-white align-top">
                          <use xlinkHref={sprite + "#it-designers-italia"} />
                        </svg>
                        <span className="sr-only">Designers Italia</span>
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="p-2 text-white" href="#" target="_blank">
                        <svg className="icon icon-sm icon-white align-top">
                          <use xlinkHref={sprite + "#it-twitter"} />
                        </svg>
                        <span className="sr-only">Twitter</span>
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="p-2 text-white" href="#" target="_blank">
                        <svg className="icon icon-sm icon-white align-top">
                          <use xlinkHref={sprite + "#it-medium"} />
                        </svg>
                        <span className="sr-only">Medium</span>
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="p-2 text-white" href="#" target="_blank">
                        <svg className="icon icon-sm icon-white align-top">
                          <use xlinkHref={sprite + "#it-behance"} />
                        </svg>
                        <span className="sr-only">Behance</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="it-footer-small-prints clearfix">
        <div className="container">
          <h3 className="sr-only">Sezione Link Utili</h3>
          <ul className="it-footer-small-prints-list list-inline mb-0 d-flex flex-column flex-md-row">
            <li className="list-inline-item">
              <a href="#" title="Note Legali">
                Media policy
              </a>
            </li>
            <li className="list-inline-item">
              <a href="#" title="Note Legali">
                Note legali
              </a>
            </li>
            <li className="list-inline-item">
              <a href="#" title="Privacy-Cookies">
                Privacy policy
              </a>
            </li>
            <li className="list-inline-item">
              <a href="#" title="Mappa del sito">
                Mappa del sito
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
