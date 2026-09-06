"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DesignSpec, generateDesign } from "@/lib/design";
import { exportPng, download, exportDielinePdf, downloadDielinePng } from "@/lib/export";
import { fileToLogoDataUrl, getLogoImage, loadLogoImage } from "@/lib/logo";
import CupPreview from "./CupPreview";
import AuthModal from "./AuthModal";
import { planLimit } from "@/lib/plans";

interface Me {
  id: number;
  email: string;
  name: string | null;
  plan: string;
  generationsUsed: number;
}

const IDEAS = [
  "Уютная кофейня, тёплый бежевый",
  "Матча латте, зелёные листья",
  "Минимализм, чёрный и золото",
  "Летний фреш, яркие волны",
  "Крафт эко-стакан",
];

export default function Studio() {
  const [me, setMe] = useState<Me | null>(null);
  const [limit, setLimit] = useState(5);
  const [history, setHistory] = useState<{ id: number; design: DesignSpec }[]>([]);
  const [prompt, setPrompt] = useState("Уютная кофейня, тёплый бежевый");
  const [design, setDesign] = useState<DesignSpec | null>(null);
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState<null | "pdf" | "png" | "dieline">(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/me");
    const data = await res.json();
    if (data.user) {
      setMe(data.user);
      setLimit(data.limit ?? planLimit(data.user.plan));
      setHistory(data.history ?? []);
    } else {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    // seed a starter preview so the studio is never empty
    setDesign(generateDesign("Уютная кофейня, тёплый бежевый", 12345));
  }, [refresh]);

  async function handleGenerate() {
    setMsg("");
    if (!me) {
      setAuthOpen(true);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, logo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Ошибка генерации");
      } else {
        setDesign({ ...data.design, logo });
        setMe((m) => (m ? { ...m, generationsUsed: data.used } : m));
        refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  function handleShuffle() {
    // local preview reshuffle without spending a quota (visual only)
    setDesign({ ...generateDesign(prompt), logo });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("");
    try {
      const dataUrl = await fileToLogoDataUrl(file);
      await loadLogoImage(dataUrl);
      setLogo(dataUrl);
      setDesign((d) => (d ? { ...d, logo: dataUrl } : d));
    } catch {
      setMsg("Не удалось загрузить логотип. Используй PNG, JPG или SVG.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeLogo() {
    setLogo(undefined);
    setDesign((d) => (d ? { ...d, logo: undefined } : d));
  }

  async function ensureLogoDecoded() {
    if (design?.logo && !getLogoImage(design.logo)) {
      try {
        await loadLogoImage(design.logo);
      } catch {
        /* ignore */
      }
    }
  }

  function requireCafe(): boolean {
    // High-res / vector-grade print exports are a paid ("Кофейня") feature.
    if (!me) {
      setAuthOpen(true);
      return false;
    }
    return true;
  }

  async function handleDownloadPng() {
    if (!design || !requireCafe()) return;
    setExporting("png");
    try {
      await ensureLogoDecoded();
      const hi = me!.plan !== "free";
      const url = exportPng(design, hi, getLogoImage(design.logo));
      download(url, `cupart-${design.seed}.png`);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPdf() {
    if (!design || !requireCafe()) return;
    if (me!.plan === "free") {
      setMsg("Экспорт в PDF-развёртку доступен на тарифе «Кофейня».");
      return;
    }
    setExporting("pdf");
    try {
      await ensureLogoDecoded();
      await exportDielinePdf(design, getLogoImage(design.logo), true);
    } catch {
      setMsg("Не удалось создать PDF. Попробуй ещё раз.");
    } finally {
      setExporting(null);
    }
  }

  async function handleDownloadDieline() {
    if (!design || !requireCafe()) return;
    if (me!.plan === "free") {
      setMsg("Развёртка для печати доступна на тарифе «Кофейня».");
      return;
    }
    setExporting("dieline");
    try {
      await ensureLogoDecoded();
      downloadDielinePng(design, getLogoImage(design.logo));
    } finally {
      setExporting(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    setHistory([]);
  }

  const used = me?.generationsUsed ?? 0;
  const pct = Math.min(100, (used / limit) * 100);

  return (
    <section id="studio" style={{ position: "relative", zIndex: 1 }}>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
          className="studio-grid"
        >
          {/* LEFT: preview */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #1c1712, #14100c)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start", marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "#43d17a", boxShadow: "0 0 8px #43d17a" }} />
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, letterSpacing: 0.4 }}>LIVE-ПРЕВЬЮ</span>
            </div>
            <div className={busy ? "" : "float"} style={{ padding: "10px 0" }}>
              <CupPreview design={design} size={320} />
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>
              Так дизайн выглядит на реальном стакане · ракурс 3/4
            </div>
          </div>

          {/* RIGHT: controls */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Опиши идею дизайна</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, margin: "4px 0 0" }}>
                Название кофейни, стиль, настроение, цвета.
              </p>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Напр.: Уютная кофейня, тёплый бежевый, кофейные зёрна"
            />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {IDEAS.map((idea) => (
                <button
                  key={idea}
                  onClick={() => setPrompt(idea)}
                  className="btn-ghost"
                  style={{ borderRadius: 99, padding: "6px 12px", fontSize: 12.5, cursor: "pointer", border: "1px solid var(--line)", background: "transparent", color: "var(--muted)" }}
                >
                  {idea}
                </button>
              ))}
            </div>

            {/* logo upload */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: "1px dashed var(--line)",
                borderRadius: 12,
                padding: "10px 12px",
                background: "var(--bg-soft)",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                style={{ display: "none" }}
              />
              {logo ? (
                <img
                  src={logo}
                  alt="Логотип"
                  style={{ width: 40, height: 40, objectFit: "contain", background: "#fff", borderRadius: 8, padding: 2 }}
                />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  🖼️
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {logo ? "Логотип добавлен" : "Свой логотип"}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  PNG/SVG · ляжет на стакан
                </div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => fileRef.current?.click()}
                style={{ borderRadius: 10, padding: "7px 12px", fontSize: 13, cursor: "pointer", border: "1px solid var(--line)", background: "transparent", color: "var(--text)" }}
              >
                {logo ? "Заменить" : "Загрузить"}
              </button>
              {logo && (
                <button
                  onClick={removeLogo}
                  title="Убрать логотип"
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
                >
                  ×
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={busy} style={{ flex: 1, minWidth: 160 }}>
                {busy ? <span className="spin" style={{ width: 16, height: 16, border: "2px solid #2a1c05", borderTopColor: "transparent", borderRadius: 99, display: "inline-block" }} /> : "✨"}
                {busy ? "Генерируем..." : "Сгенерировать дизайн"}
              </button>
              <button className="btn btn-ghost" onClick={handleShuffle} title="Другой вариант (превью)">
                🎲 Вариант
              </button>
            </div>

            {/* export group */}
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-ghost" onClick={handleDownloadPng} disabled={exporting !== null} style={{ flex: 1, minWidth: 130 }}>
                  {exporting === "png" ? "…" : "⬇ PNG"} {me && me.plan !== "free" ? "4K" : ""}
                </button>
                <button className="btn btn-ghost" onClick={handleExportPdf} disabled={exporting !== null} style={{ flex: 1, minWidth: 130 }}>
                  {exporting === "pdf" ? "Готовим PDF…" : "📄 PDF-развёртка"}
                </button>
              </div>
              <button className="btn btn-ghost" onClick={handleDownloadDieline} disabled={exporting !== null} style={{ width: "100%" }}>
                {exporting === "dieline" ? "…" : "✂ Развёртка для печати (PNG, 300 DPI)"}
              </button>
              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
                Развёртка = готовый макет стенки стакана с линиями реза и вылетами
              </div>
            </div>

            {msg && (
              <div style={{ fontSize: 14, color: "#ffb84d", background: "rgba(255,184,77,0.08)", border: "1px solid rgba(255,184,77,0.25)", borderRadius: 10, padding: "10px 12px" }}>
                {msg}{" "}
                {msg.includes("Лимит") && (
                  <a href="#pricing" style={{ color: "var(--accent)", fontWeight: 600 }}>Обновить тариф →</a>
                )}
              </div>
            )}

            {/* account / quota */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              {me ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "var(--muted)" }}>
                      {me.name || me.email} · тариф{" "}
                      <b style={{ color: "var(--accent)" }}>{me.plan === "cafe" ? "Кофейня" : "Проба"}</b>
                    </span>
                    <span style={{ color: "var(--muted)" }}>{used} / {limit}</span>
                  </div>
                  <div style={{ height: 8, background: "var(--bg-soft)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "var(--accent-2)" : "linear-gradient(90deg, var(--accent), #ffd766)", transition: "width .3s" }} />
                  </div>
                  <button onClick={logout} style={{ marginTop: 10, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
                    Выйти
                  </button>
                </div>
              ) : (
                <button className="btn btn-ghost" onClick={() => setAuthOpen(true)} style={{ width: "100%" }}>
                  Войти / Зарегистрироваться, чтобы генерировать
                </button>
              )}
            </div>
          </div>
        </div>

        {/* history */}
        {me && history.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h4 style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, marginBottom: 12 }}>
              История генераций
            </h4>
            <div className="hide-scroll" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setDesign(h.design)}
                  style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
                  title={h.design.prompt}
                >
                  <div className="card" style={{ padding: 8, borderRadius: 14 }}>
                    <CupPreview design={h.design} size={110} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={refresh} />

      <style>{`
        @media (min-width: 900px) {
          .studio-grid { grid-template-columns: 1fr 1fr; align-items: stretch; }
        }
      `}</style>
    </section>
  );
}
