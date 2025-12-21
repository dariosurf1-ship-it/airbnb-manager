import { useMemo, useState } from "react";
import PropertyHeader from "../components/PropertyHeader";
import {
  loadBookings,
  loadCodes,
  saveCodes,
  loadSelectedPropertyId,
  loadProperties,
} from "../lib/storage";
import { getRole } from "../lib/auth";

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function formatDate(yyyyMmDd) {
  if (!yyyyMmDd) return "";
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}/${m}/${y}`;
}

function daysDiff(fromISO, toISO) {
  if (!fromISO || !toISO) return null;
  const a = new Date(fromISO);
  const b = new Date(toISO);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** ---------- PROPERTY BLOCKS ---------- */
function propertyBlockEN(p) {
  const lines = [];
  if (p?.name) lines.push(`Property: ${p.name}`);
  if (p?.address) lines.push(`Address: ${p.address}`);
  if (p?.checkInTime) lines.push(`Check-in time: ${p.checkInTime}`);
  if (p?.checkOutTime) lines.push(`Check-out time: ${p.checkOutTime}`);
  if (p?.wifiName) lines.push(`Wi-Fi: ${p.wifiName}${p?.wifiPassword ? ` (Password: ${p.wifiPassword})` : ""}`);
  if (p?.houseManualUrl) lines.push(`House guide: ${p.houseManualUrl}`);
  if (p?.notes) lines.push(`Notes: ${p.notes}`);
  if (!lines.length) return "";
  return `Additional information:\n${lines.map((x) => `- ${x}`).join("\n")}`;
}
function propertyBlockIT(p) {
  const lines = [];
  if (p?.name) lines.push(`Appartamento: ${p.name}`);
  if (p?.address) lines.push(`Indirizzo: ${p.address}`);
  if (p?.checkInTime) lines.push(`Orario check-in: ${p.checkInTime}`);
  if (p?.checkOutTime) lines.push(`Orario check-out: ${p.checkOutTime}`);
  if (p?.wifiName) lines.push(`Wi-Fi: ${p.wifiName}${p?.wifiPassword ? ` (Password: ${p.wifiPassword})` : ""}`);
  if (p?.houseManualUrl) lines.push(`Guida casa: ${p.houseManualUrl}`);
  if (p?.notes) lines.push(`Note: ${p.notes}`);
  if (!lines.length) return "";
  return `Informazioni aggiuntive:\n${lines.map((x) => `- ${x}`).join("\n")}`;
}
function propertyBlockFR(p) {
  const lines = [];
  if (p?.name) lines.push(`Logement : ${p.name}`);
  if (p?.address) lines.push(`Adresse : ${p.address}`);
  if (p?.checkInTime) lines.push(`Heure d’arrivée (check-in) : ${p.checkInTime}`);
  if (p?.checkOutTime) lines.push(`Heure de départ (check-out) : ${p.checkOutTime}`);
  if (p?.wifiName) lines.push(`Wi-Fi : ${p.wifiName}${p?.wifiPassword ? ` (Mot de passe : ${p.wifiPassword})` : ""}`);
  if (p?.houseManualUrl) lines.push(`Guide du logement : ${p.houseManualUrl}`);
  if (p?.notes) lines.push(`Remarques : ${p.notes}`);
  if (!lines.length) return "";
  return `Informations complémentaires :\n${lines.map((x) => `- ${x}`).join("\n")}`;
}
function propertyBlockES(p) {
  const lines = [];
  if (p?.name) lines.push(`Alojamiento: ${p.name}`);
  if (p?.address) lines.push(`Dirección: ${p.address}`);
  if (p?.checkInTime) lines.push(`Hora de check-in: ${p.checkInTime}`);
  if (p?.checkOutTime) lines.push(`Hora de check-out: ${p.checkOutTime}`);
  if (p?.wifiName) lines.push(`Wi-Fi: ${p.wifiName}${p?.wifiPassword ? ` (Contraseña: ${p.wifiPassword})` : ""}`);
  if (p?.houseManualUrl) lines.push(`Guía de la casa: ${p.houseManualUrl}`);
  if (p?.notes) lines.push(`Notas: ${p.notes}`);
  if (!lines.length) return "";
  return `Información adicional:\n${lines.map((x) => `- ${x}`).join("\n")}`;
}
function propertyBlockDE(p) {
  const lines = [];
  if (p?.name) lines.push(`Unterkunft: ${p.name}`);
  if (p?.address) lines.push(`Adresse: ${p.address}`);
  if (p?.checkInTime) lines.push(`Check-in Zeit: ${p.checkInTime}`);
  if (p?.checkOutTime) lines.push(`Check-out Zeit: ${p.checkOutTime}`);
  if (p?.wifiName) lines.push(`WLAN: ${p.wifiName}${p?.wifiPassword ? ` (Passwort: ${p.wifiPassword})` : ""}`);
  if (p?.houseManualUrl) lines.push(`Hausanleitung: ${p.houseManualUrl}`);
  if (p?.notes) lines.push(`Hinweise: ${p.notes}`);
  if (!lines.length) return "";
  return `Zusätzliche Informationen:\n${lines.map((x) => `- ${x}`).join("\n")}`;
}
function propertyBlockByNat(nat, p) {
  switch (nat) {
    case "IT": return propertyBlockIT(p);
    case "FR": return propertyBlockFR(p);
    case "ES": return propertyBlockES(p);
    case "DE": return propertyBlockDE(p);
    default: return propertyBlockEN(p);
  }
}

/** ---------- MESSAGE TEMPLATES ---------- */
function messageEnglish({ guest, pin, validFrom, validTo }) {
  const from = formatDate(validFrom);
  const to = formatDate(validTo);
  return `Dear ${guest},

Below is the access code for the apartment: ${pin}

The code will be active:
• from ${from} (check-in)
• until ${to} (check-out)

Access instructions:
- enter the code on the smart lock keypad
- wait for the confirmation signal
- open the door and make sure it is properly closed afterwards

Should you need any assistance, please feel free to message me.
Kind regards`;
}
function messageItalian({ guest, pin, validFrom, validTo }) {
  const from = formatDate(validFrom);
  const to = formatDate(validTo);
  return `Gentile ${guest},

di seguito il codice di accesso all’appartamento: ${pin}

Il codice sarà attivo:
• dal ${from} (check-in)
• fino al ${to} (check-out)

Modalità di accesso:
- inserire il codice sulla tastiera della serratura
- attendere il segnale di conferma
- aprire la porta e richiuderla correttamente

Resto a disposizione per qualsiasi informazione.
Cordiali saluti`;
}
function messageFrench({ guest, pin, validFrom, validTo }) {
  const from = formatDate(validFrom);
  const to = formatDate(validTo);
  return `Bonjour ${guest},

Veuillez trouver ci-dessous le code d’accès à l’appartement : ${pin}

Le code sera actif :
• à partir du ${from} (check-in)
• jusqu’au ${to} (check-out)

Accès :
- saisissez le code sur le clavier de la serrure
- attendez le signal de confirmation
- ouvrez la porte et veillez à bien la refermer ensuite

Je reste à votre disposition pour toute information.
Cordialement`;
}
function messageSpanish({ guest, pin, validFrom, validTo }) {
  const from = formatDate(validFrom);
  const to = formatDate(validTo);
  return `Estimado/a ${guest},

A continuación, encontrará el código de acceso al apartamento: ${pin}

El código estará activo:
• desde ${from} (check-in)
• hasta ${to} (check-out)

Acceso:
- introduzca el código en el teclado de la cerradura
- espere la señal de confirmación
- abra la puerta y asegúrese de cerrarla correctamente después

Quedo a su disposición para cualquier información.
Atentamente`;
}
function messageGerman({ guest, pin, validFrom, validTo }) {
  const from = formatDate(validFrom);
  const to = formatDate(validTo);
  return `Guten Tag ${guest},

Unten finden Sie den Zugangscode für die Wohnung: ${pin}

Der Code ist gültig:
• ab ${from} (Check-in)
• bis ${to} (Check-out)

Zugang:
- Code am Tastenfeld des Smart Locks eingeben
- Bestätigungssignal abwarten
- Tür öffnen und anschließend bitte wieder vollständig schließen

Bei Fragen können Sie mir jederzeit schreiben.
Mit freundlichen Grüßen`;
}
function messageByNat(nat, payload) {
  switch (nat) {
    case "IT": return messageItalian(payload);
    case "FR": return messageFrench(payload);
    case "ES": return messageSpanish(payload);
    case "DE": return messageGerman(payload);
    default: return messageEnglish(payload);
  }
}

function buildBilingualMessage({ guest, pin, validFrom, validTo, nationality, property }) {
  const nat = (nationality || "EN").toUpperCase();
  const payload = { guest, pin, validFrom, validTo };

  const en = messageEnglish(payload);
  const local = messageByNat(nat, payload);

  const propEn = propertyBlockEN(property);
  const propLocal = propertyBlockByNat(nat, property);

  return `ENGLISH
${en}${propEn ? `\n\n${propEn}` : ""}

--------------------------------

${nat}
${local}${propLocal ? `\n\n${propLocal}` : ""}`;
}

/** ---------- SENDERS ---------- */
const COUNTRY_CODE = { IT: "39", FR: "33", ES: "34", DE: "49", EN: "44" };

function normalizePhoneForWhatsApp(phoneRaw, nationality) {
  if (!phoneRaw) return null;
  const nat = (nationality || "EN").toUpperCase();
  const defaultCC = COUNTRY_CODE[nat] || COUNTRY_CODE.EN;

  let p = String(phoneRaw).trim().replace(/[\s().-]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);

  if (p.startsWith("+")) {
    p = "+" + p.slice(1).replace(/[^\d]/g, "");
    const digits = p.slice(1);
    return digits.length >= 8 && digits.length <= 15 ? digits : null;
  }

  if (!/^\d+$/.test(p)) return null;
  if (p.startsWith(defaultCC) && p.length >= 8) return p.length <= 15 ? p : null;

  if (nat !== "IT" && p.startsWith("0")) p = p.replace(/^0+/, "");

  const digits = defaultCC + p;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

function buildWhatsAppUrl(phoneRaw, nationality, message) {
  const digits = normalizePhoneForWhatsApp(phoneRaw, nationality);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function buildMailtoUrl(email, subject, body) {
  if (!email) return null;
  const e = String(email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return `mailto:${encodeURIComponent(e)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function Codici() {
  const role = getRole();
  const isViewer = role !== "admin";

  const selectedPropertyId = loadSelectedPropertyId();
  const properties = loadProperties();
  const property = properties.find((p) => p.id === selectedPropertyId) || properties[0];

  const allBookings = loadBookings();
  const bookings = useMemo(
    () => allBookings.filter((b) => b.propertyId === selectedPropertyId),
    [allBookings, selectedPropertyId]
  );

  const [codes, setCodes] = useState(loadCodes);

  const confirmed = useMemo(() => bookings.filter((b) => b.status === "Confermata"), [bookings]);

  const codesForProperty = useMemo(
    () => codes.filter((c) => c.propertyId === selectedPropertyId),
    [codes, selectedPropertyId]
  );

  const codeByBookingId = useMemo(() => {
    const m = new Map();
    for (const c of codesForProperty) m.set(c.bookingId, c);
    return m;
  }, [codesForProperty]);

  function upsertCodeForBooking(b, { forceRegenerate = false } = {}) {
    if (isViewer) return alert("Sei in modalità VIEWER: non puoi creare o modificare PIN.");
    const existing = codeByBookingId.get(b.id);
    if (existing && !forceRegenerate) return;

    const pin = generatePin();
    const item = {
      id: existing?.id ?? crypto.randomUUID(),
      propertyId: selectedPropertyId,
      bookingId: b.id,
      guest: b.guest,
      channel: b.channel,
      validFrom: b.checkIn,
      validTo: b.checkOut,
      pin,
      status: "Creato (demo)",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const next = existing ? codes.map((c) => (c.id === existing.id ? item : c)) : [item, ...codes];
    setCodes(next);
    saveCodes(next);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copiato ✅");
    } catch {
      alert("Non riesco a copiare: copia manualmente.");
    }
  }

  function removeCodeByBookingId(bookingId) {
    if (isViewer) return alert("Sei in modalità VIEWER: non puoi eliminare PIN.");
    const next = codes.filter((c) => !(c.propertyId === selectedPropertyId && c.bookingId === bookingId));
    setCodes(next);
    saveCodes(next);
  }

  function buildMessageForBooking(b, pin) {
    return buildBilingualMessage({
      guest: b.guest,
      pin,
      validFrom: b.checkIn,
      validTo: b.checkOut,
      nationality: b.nationality || "EN",
      property,
    });
  }

  // ✅ Chicca: banner rosso contatto incompleto
  function contactIssues(b) {
    const pref = (b.preferredContact || "WhatsApp").toLowerCase();
    const phoneOk = !!normalizePhoneForWhatsApp(b.phone, b.nationality || "EN");
    const emailOk = !!(b.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email).trim()));

    const issues = [];
    if (!phoneOk) issues.push("WhatsApp (telefono mancante o non valido)");
    if (!emailOk) issues.push("Email (mancante o non valida)");

    // se preferenza è WhatsApp e manca telefono -> grave; idem Email
    const preferredMissing =
      (pref === "whatsapp" && !phoneOk) || (pref === "email" && !emailOk);

    return { issues, preferredMissing, phoneOk, emailOk };
  }

  // warning intelligente sulla data (es: invio troppo presto/tardi)
  function dateWarnings(b) {
    const today = new Date().toISOString().slice(0, 10);
    const d = daysDiff(today, b.checkIn); // giorni a check-in
    if (d === null) return [];
    const warns = [];
    if (d > 14) warns.push("Check-in oltre 14 giorni: forse è presto per inviare il PIN.");
    if (d < 0) warns.push("Check-in passato: verifica che non stai inviando in ritardo.");
    return warns;
  }

  function confirmSend(b, method) {
    const aptName = property?.name || selectedPropertyId;
    return window.confirm(
      `Confermi invio?\n\n` +
      `Appartamento: ${aptName}\n` +
      `Ospite: ${b.guest}\n` +
      `Metodo: ${method}\n\n` +
      `OK = invia • Annulla = stop`
    );
  }

  function openWhatsApp(b, pin) {
    const { phoneOk } = contactIssues(b);
    if (!phoneOk) return alert("Contatto incompleto: manca WhatsApp (telefono valido).");
    if (!confirmSend(b, "WhatsApp")) return;

    const msg = buildMessageForBooking(b, pin);
    const url = buildWhatsAppUrl(b.phone, b.nationality || "EN", msg);
    if (!url) return alert("Numero WhatsApp non valido o mancante.");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openEmail(b, pin) {
    const { emailOk } = contactIssues(b);
    if (!emailOk) return alert("Contatto incompleto: manca Email valida.");
    if (!confirmSend(b, "Email")) return;

    const msg = buildMessageForBooking(b, pin);
    const subject = `${property?.name || "Apartment"} – Access code`;
    const url = buildMailtoUrl(b.email, subject, msg);
    if (!url) return alert("Email non valida o mancante.");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function sendPreferred(b, pin) {
    const pref = (b.preferredContact || "WhatsApp").toLowerCase();
    if (pref === "email") return openEmail(b, pin);
    return openWhatsApp(b, pin);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={card}>
        <PropertyHeader title="Codici serratura" />

        {isViewer ? (
          <div style={infoBanner}>
            Sei in modalità <b>VIEWER</b>: puoi visualizzare e copiare, ma non creare/eliminare PIN.
          </div>
        ) : null}

        {confirmed.length === 0 ? (
          <div style={{ opacity: 0.8, marginTop: 10 }}>Nessuna prenotazione “Confermata” per questo appartamento.</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {confirmed.map((b) => {
              const existing = codeByBookingId.get(b.id);
              const nat = (b.nationality || "EN").toUpperCase();
              const issues = contactIssues(b);
              const warns = dateWarnings(b);

              return (
                <div key={b.id} style={row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>
                      {b.guest} • {b.channel} • {nat}
                    </div>
                    <div style={{ opacity: 0.9 }}>
                      {b.checkIn} → {b.checkOut}
                    </div>
                    <div style={{ opacity: 0.8, marginTop: 6 }}>
                      📞 {b.phone || "-"} • ✉️ {b.email || "-"} • Preferenza: {b.preferredContact || "WhatsApp"}
                    </div>

                    {/* ✅ Banner rosso contatto incompleto */}
                    {issues.issues.length > 0 ? (
                      <div style={issues.preferredMissing ? dangerBanner : warnBanner}>
                        <b>Contatto incompleto:</b> {issues.issues.join(" • ")}
                      </div>
                    ) : null}

                    {/* Warning data */}
                    {warns.length > 0 ? (
                      <div style={warnBanner}>
                        <b>Attenzione:</b> {warns.join(" ")}
                      </div>
                    ) : null}

                    {existing ? (
                      <div style={{ marginTop: 8 }}>
                        PIN: <span style={pill}>{existing.pin}</span>{" "}
                        <span style={{ opacity: 0.7 }}>• già creato</span>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, opacity: 0.7 }}>Nessun PIN ancora.</div>
                    )}
                  </div>

                  {existing ? (
                    <div style={actions}>
                      <button style={btn} onClick={() => sendPreferred(b, existing.pin)}>
                        Invia (preferito)
                      </button>

                      <button style={ghostBtn} onClick={() => openWhatsApp(b, existing.pin)}>
                        Apri WhatsApp
                      </button>

                      <button style={ghostBtn} onClick={() => openEmail(b, existing.pin)}>
                        Apri Email
                      </button>

                      <button style={ghostBtn} onClick={() => copy(existing.pin)}>
                        Copia PIN
                      </button>

                      <button style={ghostBtn} onClick={() => copy(buildMessageForBooking(b, existing.pin))}>
                        Copia messaggio
                      </button>

                      <button
                        style={btn}
                        onClick={() => upsertCodeForBooking(b, { forceRegenerate: true })}
                        disabled={isViewer}
                        title={isViewer ? "Viewer non può rigenerare" : "Rigenera PIN"}
                      >
                        Rigenera
                      </button>

                      <button
                        style={dangerBtn}
                        onClick={() => removeCodeByBookingId(b.id)}
                        disabled={isViewer}
                        title={isViewer ? "Viewer non può eliminare" : "Elimina PIN"}
                      >
                        Elimina
                      </button>
                    </div>
                  ) : (
                    <button
                      style={btn}
                      onClick={() => upsertCodeForBooking(b)}
                      disabled={isViewer}
                      title={isViewer ? "Viewer non può creare" : "Crea PIN"}
                    >
                      Crea PIN
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** styles */
const card = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 16,
  border: "1px solid rgba(255,255,255,0.10)",
};

const row = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.20)",
};

const actions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const pill = {
  padding: "2px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.08)",
};

const btn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "0",
  background: "#2f6fed",
  color: "white",
  cursor: "pointer",
};

const ghostBtn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "transparent",
  color: "white",
  cursor: "pointer",
};

const dangerBtn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "0",
  background: "rgba(255,80,80,0.25)",
  color: "white",
  cursor: "pointer",
};

const dangerBanner = {
  marginTop: 10,
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.14)",
};

const warnBanner = {
  marginTop: 10,
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(255,170,60,0.35)",
  background: "rgba(255,170,60,0.12)",
};

const infoBanner = {
  marginTop: 10,
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(70,140,255,0.30)",
  background: "rgba(70,140,255,0.12)",
};
