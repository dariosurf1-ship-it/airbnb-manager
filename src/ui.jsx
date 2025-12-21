import React from "react";

export function Card({ title, subtitle, right, children }) {
  return (
    <div style={styles.card}>
      {(title || subtitle || right) ? (
        <div style={styles.cardHeader}>
          <div style={{ display: "grid", gap: 2 }}>
            {title ? <div style={styles.cardTitle}>{title}</div> : null}
            {subtitle ? <div style={styles.cardSubtitle}>{subtitle}</div> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      ) : null}

      {(title || subtitle || right) ? <div style={styles.divider} /> : null}
      <div>{children}</div>
    </div>
  );
}

export function Button({ variant = "primary", style, ...props }) {
  const base = styles.btn;
  const map = {
    primary: styles.btnPrimary,
    secondary: styles.btnSecondary,
    danger: styles.btnDanger,
  };
  return <button style={{ ...base, ...(map[variant] || map.primary), ...style }} {...props} />;
}

export function Input({ label, ...props }) {
  return (
    <div>
      {label ? <div style={styles.label}>{label}</div> : null}
      <input style={styles.input} {...props} />
    </div>
  );
}

export function Select({ label, options, objectOptions = false, ...props }) {
  return (
    <div>
      {label ? <div style={styles.label}>{label}</div> : null}
      <select style={styles.input} {...props}>
        {objectOptions
          ? options.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))
          : options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
      </select>
    </div>
  );
}

export function Textarea({ label, style, ...props }) {
  return (
    <div>
      {label ? <div style={styles.label}>{label}</div> : null}
      <textarea style={{ ...styles.input, minHeight: 110, ...style }} {...props} />
    </div>
  );
}

export function Banner({ variant = "info", children }) {
  const map = {
    info: styles.bannerInfo,
    warn: styles.bannerWarn,
    danger: styles.bannerDanger,
  };
  return <div style={{ ...styles.bannerBase, ...(map[variant] || map.info) }}>{children}</div>;
}

export function Kpi({ title, value, sub }) {
  return (
    <div style={styles.kpi}>
      <div style={{ opacity: 0.8, fontWeight: 900 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 950, marginTop: 6 }}>{value}</div>
      {sub ? <div style={{ opacity: 0.7, marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
}

export function Icon({ name }) {
  // icone “pure” con emoji coerenti (zero librerie)
  const map = {
    dashboard: "📊",
    bookings: "📒",
    calendar: "🗓️",
    codes: "🔐",
    ops: "🧰",
    home: "🏠",
  };
  return <span style={{ width: 22, display: "inline-block" }}>{map[name] || "•"}</span>;
}

const styles = {
  card: {
    borderRadius: 22,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
    boxShadow: "0 20px 70px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: 950, letterSpacing: 0.2 },
  cardSubtitle: { fontSize: 12, opacity: 0.72 },

  divider: {
    height: 1,
    background: "rgba(255,255,255,0.10)",
    margin: "12px 0",
  },

  label: { marginBottom: 6, opacity: 0.85, fontWeight: 800, fontSize: 12 },

  input: {
    width: "100%",
    padding: 11,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.18)",
    color: "white",
  },

  btn: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "0",
    cursor: "pointer",
    fontWeight: 900,
    letterSpacing: 0.2,
  },
  btnPrimary: {
    background: "linear-gradient(180deg, rgba(75,139,255,1), rgba(47,111,237,1))",
    color: "white",
    boxShadow: "0 14px 36px rgba(47,111,237,0.22)",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.08)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.18)",
  },
  btnDanger: {
    background: "rgba(255,92,92,0.18)",
    color: "white",
    border: "1px solid rgba(255,92,92,0.35)",
  },

  bannerBase: {
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
  },
  bannerInfo: {
    border: "1px solid rgba(70,140,255,0.30)",
    background: "rgba(70,140,255,0.12)",
  },
  bannerWarn: {
    border: "1px solid rgba(255,180,84,0.32)",
    background: "rgba(255,180,84,0.12)",
  },
  bannerDanger: {
    border: "1px solid rgba(255,92,92,0.35)",
    background: "rgba(255,92,92,0.14)",
  },

  kpi: {
    borderRadius: 22,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.14)",
  },
};
