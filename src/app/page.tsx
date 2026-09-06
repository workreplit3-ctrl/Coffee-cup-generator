import Studio from "@/components/Studio";
import Pricing from "@/components/Pricing";

const FEATURES = [
  {
    icon: "⚡",
    title: "Генерация за секунды",
    text: "Опиши идею — движок cupart соберёт цельный дизайн: палитру, паттерн, типографику и логотип-надпись.",
  },
  {
    icon: "☕",
    title: "Честное Live-превью",
    text: "Дизайн сразу оборачивается вокруг стакана в 3/4-ракурсе с реальной кривизной и тенями. Видишь итог до печати.",
  },
  {
    icon: "🖨️",
    title: "Файл для печати в 4K",
    text: "Экспорт в высоком разрешении (до 3840px, готово к 300 DPI). Чёткие линии и текст без размытия.",
  },
  {
    icon: "📄",
    title: "PDF-развёртка для типографии",
    text: "Готовый dieline: стенка стакана развёрнута в точную дугу с линиями реза, вылетами и швом. Отдавай в печать как есть.",
  },
  {
    icon: "🏷️",
    title: "Свой логотип на стакане",
    text: "Загрузи PNG или SVG — логотип аккуратно ляжет в фирменный блок и обернётся вокруг стакана в превью и в печати.",
  },
  {
    icon: "🎨",
    title: "8 паттернов и палитр",
    text: "Кофейные зёрна, волны, листья, кольца, пар и другие стили в фирменных цветовых схемах.",
  },
  {
    icon: "🔁",
    title: "Бесконечные варианты",
    text: "Кнопка «Вариант» показывает новые версии превью, а понравившийся дизайн сохраняется в историю.",
  },
  {
    icon: "🌱",
    title: "Готово к печати на крафте",
    text: "Дизайн рассчитан на печать по кругу стакана — одностенного, двустенного или крафтового.",
  },
];

const STEPS = [
  { n: "01", t: "Опиши идею", d: "Название кофейни, настроение и цвета — пары слов достаточно." },
  { n: "02", t: "Сгенерируй", d: "cupart соберёт дизайн и мгновенно покажет его на стакане." },
  { n: "03", t: "Скачай и печатай", d: "Экспортируй чёткий файл в высоком разрешении и отправь в печать." },
];

export default function Home() {
  return (
    <main style={{ position: "relative" }}>
      {/* NAV */}
      <header
        className="glass"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
        }}
      >
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}
        >
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text)" }}>
            <CupLogo />
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
              cup<span className="gradient-text">art</span>
            </span>
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="#features" className="nav-link">Возможности</a>
            <a href="#how" className="nav-link">Как это работает</a>
            <a href="#pricing" className="nav-link">Тарифы</a>
            <a href="#studio" className="btn btn-primary" style={{ padding: "9px 18px" }}>
              Открыть студию
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 420,
            height: 420,
            background: "radial-gradient(circle, rgba(242,183,5,0.22), transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -100,
            width: 380,
            height: 380,
            background: "radial-gradient(circle, rgba(193,68,14,0.18), transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1, paddingTop: 70, paddingBottom: 40, textAlign: "center" }}>
          <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 99, border: "1px solid var(--line)", background: "var(--card)", fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
            <span style={{ color: "var(--accent)" }}>✦</span> AI-генератор дизайна кофейных стаканов
          </div>
          <h1 className="fade-up" style={{ fontSize: "clamp(38px, 6vw, 68px)", fontWeight: 800, lineHeight: 1.05, margin: "0 auto 20px", maxWidth: 900, letterSpacing: -1.5 }}>
            Фирменный стакан
            <br />
            за <span className="gradient-text">30 секунд</span>
          </h1>
          <p className="fade-up" style={{ fontSize: "clamp(16px, 2.2vw, 20px)", color: "var(--muted)", maxWidth: 620, margin: "0 auto 32px" }}>
            Опиши идею — cupart сгенерирует уникальный дизайн, покажет его на настоящем стакане в live-превью и отдаст чёткий файл для печати.
          </p>
          <div className="fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#studio" className="btn btn-primary" style={{ fontSize: 16, padding: "14px 28px" }}>
              ✨ Создать дизайн бесплатно
            </a>
            <a href="#how" className="btn btn-ghost" style={{ fontSize: 16, padding: "14px 28px" }}>
              Как это работает
            </a>
          </div>
          <div className="fade-up" style={{ marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
            Без установки · 5 бесплатных генераций · работает в браузере
          </div>
        </div>
      </section>

      {/* STUDIO */}
      <Studio />

      {/* FEATURES */}
      <section id="features" style={{ position: "relative", zIndex: 1, background: "var(--bg-soft)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 40px" }}>
            <span style={{ fontSize: 13, letterSpacing: 1.5, color: "var(--accent)", fontWeight: 700 }}>ВОЗМОЖНОСТИ</span>
            <h2 style={{ fontSize: 38, fontWeight: 800, margin: "10px 0 0", lineHeight: 1.1 }}>
              Всё для дизайна стакана
            </h2>
          </div>
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: 14.5, margin: 0, lineHeight: 1.55 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ position: "relative", zIndex: 1 }}>
        <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
            <span style={{ fontSize: 13, letterSpacing: 1.5, color: "var(--accent)", fontWeight: 700 }}>КАК ЭТО РАБОТАЕТ</span>
            <h2 style={{ fontSize: 38, fontWeight: 800, margin: "10px 0 0", lineHeight: 1.1 }}>
              Три шага до готового стакана
            </h2>
          </div>
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {STEPS.map((s) => (
              <div key={s.n} className="card" style={{ padding: 28 }}>
                <div className="gradient-text" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{s.n}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "14px 0 8px" }}>{s.t}</h3>
                <p style={{ color: "var(--muted)", fontSize: 15, margin: 0, lineHeight: 1.55 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <Pricing />

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 1 }}>
        <div className="container" style={{ paddingBottom: 70 }}>
          <div className="card" style={{ padding: "48px 32px", textAlign: "center", background: "linear-gradient(120deg, #201a13, #17130f)", border: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, margin: "0 0 12px" }}>
              Готов оформить свой стакан?
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 17, maxWidth: 520, margin: "0 auto 28px" }}>
              Создай первый дизайн бесплатно прямо сейчас. Без карты и установки.
            </p>
            <a href="#studio" className="btn btn-primary" style={{ fontSize: 16, padding: "14px 30px" }}>
              ✨ Открыть студию cupart
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--line)", position: "relative", zIndex: 1 }}>
        <div className="container" style={{ padding: "28px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CupLogo />
            <span style={{ fontWeight: 800, fontSize: 18 }}>
              cup<span className="gradient-text">art</span>
            </span>
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            © {new Date().getFullYear()} cupart · AI-дизайн кофейных стаканов
          </div>
        </div>
      </footer>

      <style>{`
        .nav-link {
          color: var(--muted);
          text-decoration: none;
          font-size: 14.5px;
          font-weight: 500;
          padding: 8px 12px;
          border-radius: 8px;
          transition: color .15s, background .15s;
        }
        .nav-link:hover { color: var(--text); background: var(--card); }
        @media (max-width: 720px) {
          .nav-link { display: none; }
        }
      `}</style>
    </main>
  );
}

function CupLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2b705" />
          <stop offset="1" stopColor="#c1440e" />
        </linearGradient>
      </defs>
      <path d="M7 9h18l-1.8 17.5a2 2 0 0 1-2 1.8H10.8a2 2 0 0 1-2-1.8L7 9Z" fill="url(#lg)" />
      <rect x="5.5" y="6" width="21" height="4" rx="2" fill="#f4ede3" />
      <path d="M13 2c-1.2 1.2-1.2 2.4 0 3.6M19 2c-1.2 1.2-1.2 2.4 0 3.6" stroke="#f2b705" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
