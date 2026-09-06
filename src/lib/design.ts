// -----------------------------------------------------------------------------
// Deterministic cup-artwork generator.
//
// A "design" is a compact JSON spec (palette + pattern + text + seed). Because
// it is fully deterministic from the seed, the same design renders identically
// in the live preview and in the high-resolution download — and can be stored
// in the DB and re-rendered later.
//
// The renderer (renderArtwork) draws the FLAT printable wrap. The preview
// component wraps that flat artwork around a cup silhouette.
// -----------------------------------------------------------------------------

export interface DesignSpec {
  seed: number;
  prompt: string;
  palette: string[]; // [bg, c1, c2, c3, accent]
  pattern: PatternId;
  text: string;
  subtext: string;
  font: string;
  textColor: string;
  logo?: string; // optional user logo as a data URL (persisted & re-rendered)
}

export type PatternId =
  | "beans"
  | "waves"
  | "confetti"
  | "grid"
  | "rings"
  | "leaves"
  | "steam"
  | "triangles";

const PATTERNS: PatternId[] = [
  "beans",
  "waves",
  "confetti",
  "grid",
  "rings",
  "leaves",
  "steam",
  "triangles",
];

// Curated palettes (coffee / cafe friendly, high contrast, print-safe).
const PALETTES: string[][] = [
  ["#3b2417", "#c9a27e", "#e8d5c0", "#7a4a2b", "#f2b705"],
  ["#0f2e2e", "#1f6f6f", "#8fd6cf", "#f4f1e8", "#ff8a5c"],
  ["#2b1a3d", "#7c5cbf", "#c9b6f2", "#f6f2ff", "#ffd23f"],
  ["#1a1a1a", "#4a4a4a", "#dcdcdc", "#f5f5f5", "#e63946"],
  ["#123", "#2a6f97", "#a9d6e5", "#f7f7f2", "#ffb703"],
  ["#3a1c1c", "#a83232", "#e9c46a", "#fdf6ec", "#2a9d8f"],
  ["#14301f", "#3a7d44", "#b7e4c7", "#f6fbf4", "#f4a259"],
  ["#2d2114", "#b08968", "#e6ccb2", "#fffaf3", "#c1440e"],
];

const FONTS = [
  "'Poppins', 'Segoe UI', sans-serif",
  "Georgia, 'Times New Roman', serif",
  "'Trebuchet MS', sans-serif",
  "'Courier New', monospace",
];

// Small deterministic PRNG (mulberry32).
export function rng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length) % arr.length];
}

// --- contrast helpers (WCAG relative luminance) ---
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const full =
    c.length === 3 ? c.split("").map((x) => x + x).join("") : c.padEnd(6, "0");
  const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Pick the candidate color with the strongest contrast against `bg`; if none
// clears the readable threshold, fall back to black/white.
function bestContrast(bg: string, candidates: string[]): string {
  let best = candidates[0];
  let bestR = 0;
  for (const c of candidates) {
    const r = contrastRatio(bg, c);
    if (r > bestR) {
      bestR = r;
      best = c;
    }
  }
  if (bestR < 4.5) {
    best = luminance(bg) > 0.5 ? "#1a1a1a" : "#ffffff";
  }
  return best;
}

// Derive a nice default headline from the prompt.
function deriveText(prompt: string): { text: string; subtext: string } {
  const clean = prompt.trim();
  if (!clean) return { text: "CUPART", subtext: "coffee & co" };
  const words = clean.split(/\s+/).filter(Boolean);
  const text = words.slice(0, 2).join(" ").toUpperCase().slice(0, 18);
  const subtext = words.slice(2, 5).join(" ").toLowerCase() || "fresh every day";
  return { text: text || "CUPART", subtext };
}

// Build a design deterministically from a prompt + optional seed.
export function generateDesign(prompt: string, seed?: number): DesignSpec {
  const s = seed ?? Math.floor(Math.random() * 1e9);
  const r = rng(s);
  const palette = pick(r, PALETTES);
  const pattern = pick(r, PATTERNS);
  const font = pick(r, FONTS);
  const { text, subtext } = deriveText(prompt);
  // The label band is drawn in palette[3] (light). Pick the palette color with
  // the best contrast against it for the headline so text is always readable.
  const band = palette[3];
  const textColor = bestContrast(band, [palette[0], palette[3 + 1], palette[1]]);
  return {
    seed: s,
    prompt,
    palette,
    pattern,
    text,
    subtext,
    font,
    textColor,
  };
}

// -----------------------------------------------------------------------------
// Renderer — draws the flat printable wrap onto any CanvasRenderingContext2D.
// `w` and `h` are the target pixel dimensions; everything scales off them so
// the SAME routine gives a crisp preview and a 4K export.
// -----------------------------------------------------------------------------
export function renderArtwork(
  ctx: CanvasRenderingContext2D,
  spec: DesignSpec,
  w: number,
  h: number,
  logoImage?: CanvasImageSource | null
) {
  const [bg, c1, c2, c3, accent] = spec.palette;
  const r = rng(spec.seed ^ 0x9e3779b9);
  ctx.clearRect(0, 0, w, h);

  // background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const hasLogo = !!logoImage;
  // With a logo the label band grows a bit taller to host it above the text.
  const bandH = hasLogo ? h * 0.46 : h * 0.24;
  const bandTop = hasLogo ? h * 0.28 : h * 0.4;

  drawPattern(ctx, spec.pattern, [bg, c1, c2, c3, accent], w, h, r);

  // central band (clean area for the logo/text)
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = c3;
  roundRect(ctx, w * 0.06, bandTop, w * 0.88, bandH, h * 0.03);
  ctx.fill();
  ctx.restore();

  // --- optional user logo (fit inside the top portion of the band) ---
  let textAreaTop = bandTop;
  if (hasLogo && logoImage) {
    const dims = imageSize(logoImage);
    const maxW = w * 0.45;
    const maxH = bandH * 0.42;
    const scale = Math.min(maxW / dims.w, maxH / dims.h);
    const lw = dims.w * scale;
    const lh = dims.h * scale;
    const lx = w * 0.5 - lw / 2;
    const ly = bandTop + bandH * 0.08;
    ctx.drawImage(logoImage, lx, ly, lw, lh);
    textAreaTop = ly + lh;
  }

  // layout anchors for text (shift down when a logo is present)
  const titleY = hasLogo ? textAreaTop + bandH * 0.16 : bandTop + bandH * 0.4;
  const underlineY = hasLogo ? textAreaTop + bandH * 0.28 : bandTop + bandH * 0.72;
  const subY = hasLogo ? textAreaTop + bandH * 0.36 : bandTop + bandH * 0.9;

  // accent underline
  ctx.fillStyle = accent;
  roundRect(ctx, w * 0.5 - w * 0.11, underlineY, w * 0.22, h * 0.012, h * 0.006);
  ctx.fill();

  // headline
  ctx.fillStyle = spec.textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titleSize = Math.min(h * 0.11, (w * 0.8) / Math.max(6, spec.text.length) * 1.5);
  ctx.font = `700 ${titleSize}px ${spec.font}`;
  ctx.fillText(spec.text, w * 0.5, titleY, w * 0.82);

  // subtext (uses a muted version of the readable headline color)
  ctx.fillStyle = spec.textColor;
  ctx.globalAlpha = 0.75;
  const subSize = titleSize * 0.42;
  ctx.font = `500 ${subSize}px ${spec.font}`;
  ctx.fillText(spec.subtext, w * 0.5, subY, w * 0.82);
  ctx.globalAlpha = 1;
}

// Read intrinsic dimensions from any CanvasImageSource.
function imageSize(img: CanvasImageSource): { w: number; h: number } {
  const anyImg = img as unknown as {
    naturalWidth?: number;
    naturalHeight?: number;
    width?: number;
    height?: number;
  };
  return {
    w: anyImg.naturalWidth || anyImg.width || 1,
    h: anyImg.naturalHeight || anyImg.height || 1,
  };
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  pattern: PatternId,
  pal: string[],
  w: number,
  h: number,
  r: () => number
) {
  const [, c1, c2, , accent] = pal;
  const colors = [c1, c2, accent];

  switch (pattern) {
    case "beans": {
      const n = 26;
      for (let i = 0; i < n; i++) {
        const x = r() * w;
        const y = r() * h;
        const s = (0.02 + r() * 0.03) * h;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r() * Math.PI);
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pal[0];
        ctx.lineWidth = s * 0.14;
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.3);
        ctx.quadraticCurveTo(0, 0, s * 0.5, s * 0.3);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case "waves": {
      const rows = 9;
      for (let i = 0; i < rows; i++) {
        ctx.strokeStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = h * 0.012;
        ctx.beginPath();
        const y = (i / rows) * h;
        for (let x = 0; x <= w; x += 6) {
          const yy = y + Math.sin((x / w) * Math.PI * 4 + i) * h * 0.02;
          x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "confetti": {
      const n = 90;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = colors[Math.floor(r() * colors.length)];
        ctx.globalAlpha = 0.8;
        const x = r() * w;
        const y = r() * h;
        const s = (0.006 + r() * 0.014) * h;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r() * Math.PI);
        ctx.fillRect(-s, -s * 0.4, s * 2, s * 0.8);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "grid": {
      ctx.strokeStyle = c2;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = h * 0.004;
      const step = w / 12;
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.9;
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(
          Math.floor(r() * 12) * step,
          Math.floor(r() * 12) * step,
          h * 0.012,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "rings": {
      const n = 14;
      for (let i = 0; i < n; i++) {
        ctx.strokeStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = h * 0.01;
        ctx.beginPath();
        ctx.arc(r() * w, r() * h, (0.03 + r() * 0.08) * h, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "leaves": {
      const n = 22;
      for (let i = 0; i < n; i++) {
        ctx.save();
        ctx.translate(r() * w, r() * h);
        ctx.rotate(r() * Math.PI * 2);
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.8;
        const s = (0.02 + r() * 0.03) * h;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * 0.7, 0, 0, s);
        ctx.quadraticCurveTo(-s * 0.7, 0, 0, -s);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "steam": {
      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = h * 0.014;
        ctx.beginPath();
        const x0 = (i + 0.5) * (w / 6);
        for (let y = 0; y <= h; y += 6) {
          const xx = x0 + Math.sin((y / h) * Math.PI * 3 + i) * w * 0.03;
          y === 0 ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "triangles": {
      const n = 40;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = colors[Math.floor(r() * colors.length)];
        ctx.globalAlpha = 0.75;
        const x = r() * w;
        const y = r() * h;
        const s = (0.02 + r() * 0.03) * h;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s, y + s);
        ctx.lineTo(x - s, y + s);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const rr = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
