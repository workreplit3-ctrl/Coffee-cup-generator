"use client";

import { PLANS } from "@/lib/plans";

export default function Pricing() {
  return (
    <section id="pricing" style={{ position: "relative", zIndex: 1 }}>
      <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
          <span style={{ fontSize: 13, letterSpacing: 1.5, color: "var(--accent)", fontWeight: 700 }}>
            ТАРИФЫ
          </span>
          <h2 style={{ fontSize: 38, fontWeight: 800, margin: "10px 0 8px", lineHeight: 1.1 }}>
            Простые и честные тарифы
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 16 }}>
            Начни бесплатно. Перейди на «Кофейню», когда понадобится больше генераций и печать без водяного знака.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                padding: 28,
                position: "relative",
                border: plan.highlight ? "1.5px solid var(--accent)" : "1px solid var(--line)",
                boxShadow: plan.highlight ? "0 20px 60px -20px rgba(242,183,5,0.4)" : "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {plan.highlight && (
                <span
                  style={{
                    position: "absolute",
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(100deg, var(--accent), #ffd766)",
                    color: "#2a1c05",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 14px",
                    borderRadius: 99,
                    whiteSpace: "nowrap",
                  }}
                >
                  ПОПУЛЯРНЫЙ ВЫБОР
                </span>
              )}
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 2px" }}>{plan.name}</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 14px" }}>{plan.tagline}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{plan.price}</span>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>{plan.priceNote}</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600, marginBottom: 18 }}>
                {plan.limit} генераций{plan.id === "cafe" ? " / месяц" : ""}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "grid", gap: 10, flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 10, fontSize: 14.5, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#studio"
                className={`btn ${plan.highlight ? "btn-primary" : "btn-ghost"}`}
                style={{ width: "100%" }}
              >
                {plan.id === "free" ? "Начать бесплатно" : "Выбрать «Кофейню»"}
              </a>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 24 }}>
          Оплата картой · отмена в любой момент · без скрытых платежей
        </p>
      </div>
    </section>
  );
}
