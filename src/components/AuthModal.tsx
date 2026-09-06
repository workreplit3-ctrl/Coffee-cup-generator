"use client";

import { useState } from "react";

export default function AuthModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card fade-up"
        style={{ width: "100%", maxWidth: 420, padding: 28 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            {mode === "register" ? "Создать аккаунт" : "Вход"}
          </h3>
          <button onClick={onClose} className="btn-ghost" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)", fontSize: 22 }}>
            ×
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
          {mode === "register"
            ? "Регистрация бесплатна — 5 генераций сразу."
            : "Рады видеть снова ☕"}
        </p>

        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {mode === "register" && (
            <input
              placeholder="Имя (необязательно)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль (мин. 6 символов)"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <div style={{ color: "#ff7a7a", fontSize: 14 }}>{error}</div>
          )}
          <button className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "..." : mode === "register" ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "var(--muted)" }}>
          {mode === "register" ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError("");
            }}
            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
          >
            {mode === "register" ? "Войти" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}
