import React from "react";
import PropertyHeader from "../components/PropertyHeader";

export default function Dashboard() {
  return (
    <div className="page">
      {/* Header proprietà/utente */}
      <div className="pageTop">
        <PropertyHeader />
      </div>

      <header className="pageHeader">
        <div>
          <h1>Airbnb Manager</h1>
          <p>Dashboard operativa: prenotazioni, calendario, codici, pulizie.</p>
        </div>

        <div className="actions">
          <button className="btn">Profilo</button>
          <button className="btn">Accessi</button>
          <button className="btn">Condivisione</button>
          <button className="btn danger">Logout</button>
        </div>
      </header>

      <section className="grid">
        <div className="card span6">
          <div className="cardTitle">Panoramica</div>
          <div className="cardText">
            Qui metti KPI (occupazione, ADR, RevPAR), stato pulizie, alert, ecc.
          </div>
        </div>

        <div className="card span6">
          <div className="cardTitle">Oggi</div>
          <div className="cardText">
            Arrivi/partenze e task rapidi (check-in, messaggi, manutenzioni).
          </div>
        </div>

        <div className="card span12">
          <div className="cardTitle">Prossime azioni</div>
          <div className="cardText">
            - Conferma arrivi<br />
            - Invia istruzioni self check-in<br />
            - Pianifica pulizie<br />
            - Verifica codici serratura
          </div>
        </div>
      </section>
    </div>
  );
}
