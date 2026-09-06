import { DesignSpec, renderArtwork } from "./design";

// =============================================================================
// Export utilities
//   • exportPng           — flat printable wrap (PNG), crisp up to 4K
//   • renderDielineCanvas — the cup body unrolled into its TRUE shape (an
//                           annular sector), with artwork warped, cut/bleed/fold
//                           guides and a title block. Print-accurate.
//   • exportDielinePdf    — multi-page PDF: page 1 dieline, page 2 flat wrap +
//                           spec sheet. Ready to send to a cup printer.
// =============================================================================

type OffscreenFactory = (w: number, h: number) => HTMLCanvasElement;

const defaultOffscreen: OffscreenFactory = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

// ---- Physical cup spec (12 oz / 350 ml standard single-wall) ----
export const CUP = {
  topDia: 90, // mm, rim diameter
  botDia: 62, // mm, base diameter
  height: 108, // mm, body height
  bleed: 3, // mm
  glueTab: 8, // mm seam glue tab
  margin: 14, // mm page margin around artwork
};

// -----------------------------------------------------------------------------
// Flat wrap PNG (the rectangular print), crisp.
// -----------------------------------------------------------------------------
export function exportPng(
  design: DesignSpec,
  hi: boolean,
  logoImage?: CanvasImageSource | null
): string {
  const w = hi ? 3840 : 1280;
  const h = Math.round(w * (520 / 900));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  renderArtwork(ctx, design, w, h, logoImage);

  if (!hi) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.font = `600 ${h * 0.035}px Poppins, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText("made with cupart · free", w - 24, h - 20);
    ctx.restore();
  }
  return canvas.toDataURL("image/png");
}

// -----------------------------------------------------------------------------
// Dieline geometry (all in mm, apex at origin, sector opens downward).
// A truncated cone unrolls into an annular sector.
// -----------------------------------------------------------------------------
export interface DielineGeo {
  topR: number;
  botR: number;
  L: number; // slant height
  rhoTop: number; // radius of outer arc (= rim)
  rhoBot: number; // radius of inner arc (= base)
  theta: number; // sector angle (rad)
  bbox: { xMin: number; xMax: number; yMin: number; yMax: number };
}

export function dielineGeometry(): DielineGeo {
  const topR = CUP.topDia / 2;
  const botR = CUP.botDia / 2;
  const L = Math.hypot(CUP.height, topR - botR);
  const rhoBot = (L * botR) / (topR - botR);
  const rhoTop = rhoBot + L;
  const theta = (2 * Math.PI * (topR - botR)) / L;
  const half = theta / 2;
  const xMax = rhoTop * Math.sin(half);
  // Apex-down orientation: a sector point at (rho, a) maps to
  //   x = rho*sin(a), y = -rho*cos(a)
  // so the wide rim arc (rhoTop) sits at the TOP of the sheet and the artwork
  // reads upright.
  const bbox = {
    xMin: -xMax,
    xMax,
    yMin: -rhoTop, // top (rim)
    yMax: -rhoBot * Math.cos(half), // bottom (base), nearest the apex
  };
  return { topR, botR, L, rhoTop, rhoBot, theta, bbox };
}

// Total artwork area in mm including bleed + glue tab (used to size the page).
function dielineExtent(g: DielineGeo) {
  const b = CUP.bleed;
  return {
    // widen x a touch for the glue tab that sticks out past the left radial edge
    xMin: g.bbox.xMin - b - CUP.glueTab,
    xMax: g.bbox.xMax + b,
    yMin: g.bbox.yMin - b,
    yMax: g.bbox.yMax + b,
  };
}

// -----------------------------------------------------------------------------
// Render the dieline (warped artwork + guides + title block) into a canvas.
// Returns the canvas plus the mm→page placement so a PDF can size to match.
// -----------------------------------------------------------------------------
export function renderDielineCanvas(
  design: DesignSpec,
  logoImage: CanvasImageSource | null,
  opts: { dpi?: number; guides?: boolean; makeOffscreen?: OffscreenFactory } = {}
): { canvas: HTMLCanvasElement; widthMm: number; heightMm: number; geo: DielineGeo } {
  const dpi = opts.dpi ?? 300;
  const guides = opts.guides ?? true;
  const off = opts.makeOffscreen ?? defaultOffscreen;
  const s = dpi / 25.4; // px per mm

  const g = dielineGeometry();
  const ext = dielineExtent(g);
  const m = CUP.margin;
  const widthMm = ext.xMax - ext.xMin + m * 2;
  const heightMm = ext.yMax - ext.yMin + m * 2;

  const W = Math.round(widthMm * s);
  const H = Math.round(heightMm * s);
  const canvas = off(W, H);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // white print sheet
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // transform: mm(apex-origin) -> px, with margin + extent offset
  // pxX = (x - ext.xMin + m) * s ; pxY = (y - ext.yMin + m) * s
  const ox = (-ext.xMin + m) * s;
  const oy = (-ext.yMin + m) * s;
  const toPx = (x: number, y: number): [number, number] => [ox + x * s, oy + y * s];

  // apex position in px
  const apex = toPx(0, 0);

  // ---- flat artwork buffer ----
  const artW = 1600;
  const artH = 920;
  const art = off(artW, artH);
  renderArtwork(art.getContext("2d")!, design, artW, artH, logoImage);

  // ---- warp artwork into the sector (bleed-extended) ----
  const bleedR = CUP.bleed;
  const rOuter = (g.rhoTop + bleedR) * s;
  const rInner = (g.rhoBot - bleedR) * s;
  const half = g.theta / 2;
  const halfBleed = half + (CUP.bleed / g.rhoTop); // slight angular bleed

  ctx.save();
  ctx.translate(apex[0], apex[1]);
  const slices = 480;
  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    const a0 = -halfBleed + t0 * halfBleed * 2;
    const a1 = -halfBleed + t1 * halfBleed * 2;
    const srcX = t0 * (artW - 1);
    const srcW = Math.max(1, (t1 - t0) * (artW - 1));

    ctx.save();
    // Apex-down: after rotate(mid), local -y points radially outward, so the
    // rim (rOuter) is up. Art top (rim) -> y=-rOuter, art bottom (base) -> -rInner.
    const mid = (a0 + a1) / 2;
    ctx.rotate(mid);
    const colW = rOuter * Math.tan((a1 - a0) / 2) * 2 + 2;
    ctx.drawImage(art, srcX, 0, srcW, artH, -colW / 2, -rOuter, colW, rOuter - rInner);
    ctx.restore();
  }
  ctx.restore();

  // Clip artwork strictly to the bleed sector so edges are clean.
  // (Redraw white outside the bleed sector using even-odd fill.)
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  // whole canvas
  ctx.rect(0, 0, W, H);
  // sector hole (bleed) as counter path
  sectorPath(ctx, apex, rInner, rOuter, halfBleed, true);
  ctx.fill("evenodd");
  ctx.restore();

  if (guides) {
    drawGuides(ctx, apex, g, s, toPx, W, H, design);
  }

  return { canvas, widthMm, heightMm, geo: g };
}

// Build a sector (annular wedge) path around apex.
function sectorPath(
  ctx: CanvasRenderingContext2D,
  apex: [number, number],
  rInner: number,
  rOuter: number,
  half: number,
  newPath: boolean
) {
  // Apex-down mapping: point(rho,a) = apex + (rho*sin a, -rho*cos a)
  const steps = 80;
  const px = (rho: number, a: number) => apex[0] + rho * Math.sin(a);
  const py = (rho: number, a: number) => apex[1] - rho * Math.cos(a);
  if (newPath) ctx.moveTo(px(rOuter, -half), py(rOuter, -half));
  else {
    ctx.beginPath();
    ctx.moveTo(px(rOuter, -half), py(rOuter, -half));
  }
  for (let i = 0; i <= steps; i++) {
    const a = -half + (i / steps) * 2 * half;
    ctx.lineTo(px(rOuter, a), py(rOuter, a));
  }
  for (let i = steps; i >= 0; i--) {
    const a = -half + (i / steps) * 2 * half;
    ctx.lineTo(px(rInner, a), py(rInner, a));
  }
  ctx.closePath();
}

function drawGuides(
  ctx: CanvasRenderingContext2D,
  apex: [number, number],
  g: DielineGeo,
  s: number,
  toPx: (x: number, y: number) => [number, number],
  W: number,
  H: number,
  design: DesignSpec
) {
  const half = g.theta / 2;
  const rOuterCut = g.rhoTop * s;
  const rInnerCut = g.rhoBot * s;
  const rOuterBleed = (g.rhoTop + CUP.bleed) * s;
  const rInnerBleed = (g.rhoBot - CUP.bleed) * s;

  // bleed line (dashed grey)
  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "#c8102e";
  ctx.lineWidth = Math.max(1, s * 0.25);
  ctx.beginPath();
  sectorPath(ctx, apex, rInnerBleed, rOuterBleed, half + CUP.bleed / g.rhoTop, false);
  ctx.stroke();
  ctx.restore();

  // cut line (solid black)
  ctx.save();
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = Math.max(1.2, s * 0.3);
  ctx.beginPath();
  sectorPath(ctx, apex, rInnerCut, rOuterCut, half, false);
  ctx.stroke();
  ctx.restore();

  // fold/seam line (dashed blue) on the left radial edge + glue tab outline
  ctx.save();
  ctx.strokeStyle = "#1f6feb";
  ctx.setLineDash([10, 5]);
  ctx.lineWidth = Math.max(1, s * 0.22);
  // left radial edge (seam) in apex-down coords: point = apex + (rho*sin a, -rho*cos a)
  const liX = apex[0] + rInnerCut * Math.sin(-half);
  const liY = apex[1] - rInnerCut * Math.cos(-half);
  const loX = apex[0] + rOuterCut * Math.sin(-half);
  const loY = apex[1] - rOuterCut * Math.cos(-half);
  ctx.beginPath();
  ctx.moveTo(liX, liY);
  ctx.lineTo(loX, loY);
  ctx.stroke();
  ctx.restore();

  // registration crosshair marks in the four page corners
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = Math.max(1, s * 0.2);
  const rm = 6 * s;
  const corners: [number, number][] = [
    [rm * 1.2, rm * 1.2],
    [W - rm * 1.2, rm * 1.2],
    [rm * 1.2, H - rm * 1.2],
    [W - rm * 1.2, H - rm * 1.2],
  ];
  for (const [cxp, cyp] of corners) {
    ctx.beginPath();
    ctx.moveTo(cxp - rm, cyp);
    ctx.lineTo(cxp + rm, cyp);
    ctx.moveTo(cxp, cyp - rm);
    ctx.lineTo(cxp, cyp + rm);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cxp, cyp, rm * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // ---- title block (bottom-left) ----
  ctx.save();
  ctx.fillStyle = "#111";
  ctx.textBaseline = "alphabetic";
  const fs = 4.2 * s;
  ctx.font = `700 ${fs}px Poppins, Arial, sans-serif`;
  const tx = 5 * s;
  let ty = H - 22 * s;
  ctx.fillText("cupart · DIELINE / РАЗВЁРТКА СТАКАНА", tx, ty);
  ctx.font = `400 ${fs * 0.82}px Arial, sans-serif`;
  ty += fs * 1.4;
  ctx.fillText(
    `Стакан 350 мл · ⌀ верх ${CUP.topDia} мм · ⌀ низ ${CUP.botDia} мм · высота ${CUP.height} мм`,
    tx,
    ty
  );
  ty += fs * 1.1;
  ctx.fillText(
    `Вылет (bleed) ${CUP.bleed} мм · клеевой шов ${CUP.glueTab} мм · 300 DPI · CMYK при печати`,
    tx,
    ty
  );
  ty += fs * 1.1;
  ctx.fillText(`Дизайн #${design.seed} · «${design.text}»`, tx, ty);
  ctx.restore();

  // legend (bottom-right)
  ctx.save();
  const lx = W - 62 * s;
  let ly = H - 22 * s;
  const legendFs = 3.4 * s;
  const items: [string, string, number[]][] = [
    ["Линия реза (cut)", "#111111", []],
    ["Вылет (bleed)", "#c8102e", [6, 6]],
    ["Шов/склейка (fold)", "#1f6feb", [10, 5]],
  ];
  for (const [label, color, dash] of items) {
    ctx.strokeStyle = color;
    ctx.setLineDash(dash.map((d) => d * s * 0.5));
    ctx.lineWidth = Math.max(1, s * 0.28);
    ctx.beginPath();
    ctx.moveTo(lx, ly - legendFs * 0.35);
    ctx.lineTo(lx + 10 * s, ly - legendFs * 0.35);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#111";
    ctx.font = `400 ${legendFs}px Arial, sans-serif`;
    ctx.fillText(label, lx + 12 * s, ly);
    ly += legendFs * 1.6;
  }
  ctx.restore();
}

// -----------------------------------------------------------------------------
// PDF export (dynamic import so jsPDF stays out of the main bundle).
// -----------------------------------------------------------------------------
export async function exportDielinePdf(
  design: DesignSpec,
  logoImage: CanvasImageSource | null,
  hi: boolean
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const dpi = hi ? 300 : 150;

  const { canvas, widthMm, heightMm } = renderDielineCanvas(design, logoImage, {
    dpi,
    guides: true,
  });
  const landscape = widthMm >= heightMm;
  const pdf = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "mm",
    format: [Math.max(widthMm, heightMm), Math.min(widthMm, heightMm)],
    compress: true,
  });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  // fit the dieline sheet centred on the page
  const scale = Math.min(pw / widthMm, ph / heightMm);
  const dw = widthMm * scale;
  const dh = heightMm * scale;
  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    (pw - dw) / 2,
    (ph - dh) / 2,
    dw,
    dh,
    undefined,
    "FAST"
  );

  // ---- page 2: flat wrap preview + spec ----
  const flatUrl = exportPng(design, true, logoImage);
  pdf.addPage([297, 210], "landscape");
  pdf.setFontSize(16);
  pdf.text("cupart — печатный макет (развёртка боковой стенки)", 14, 18);
  pdf.setFontSize(10);
  pdf.text(
    [
      `Дизайн #${design.seed} · «${design.text}»`,
      `Стакан 350 мл · ⌀ верх ${CUP.topDia} мм · низ ${CUP.botDia} мм · высота ${CUP.height} мм`,
      `Плоский макет ниже соответствует боковой стенке. Печать 300 DPI, вылеты 3 мм.`,
      logoImage ? "Логотип: пользовательский" : "Логотип: не задан (только текст/паттерн)",
    ],
    14,
    26
  );
  const iw = 260;
  const ih = iw * (520 / 900);
  pdf.addImage(flatUrl, "PNG", 14, 46, iw, ih, undefined, "FAST");
  pdf.setDrawColor(180);
  pdf.rect(14, 46, iw, ih);

  pdf.save(`cupart-dieline-${design.seed}.pdf`);
}

export function download(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadDielinePng(
  design: DesignSpec,
  logoImage: CanvasImageSource | null
) {
  const { canvas } = renderDielineCanvas(design, logoImage, { dpi: 300, guides: true });
  download(canvas.toDataURL("image/png"), `cupart-dieline-${design.seed}.png`);
}
