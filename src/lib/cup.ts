import { DesignSpec, renderArtwork } from "./design";

// -----------------------------------------------------------------------------
// Draws a realistic paper coffee cup with the design's artwork wrapped around
// its body, into any 2D context of pixel size W x H. Shared by the live preview
// (browser canvas) and the render tests (node canvas), so what you test is what
// ships.
//
// Geometry: a truncated cone (wide rim, slightly narrower base) seen at a 3/4
// angle, with elliptical rim + base, a domed lid, cylinder shading and a soft
// highlight. The flat artwork is wrapped by drawing vertical slices whose source
// column is compressed toward the edges to fake the curvature — gently, so text
// stays readable.
// -----------------------------------------------------------------------------
export function drawCup(
  ctx: CanvasRenderingContext2D,
  design: DesignSpec | null,
  W: number,
  H: number,
  createOffscreen?: (w: number, h: number) => HTMLCanvasElement,
  logoImage?: CanvasImageSource | null
) {
  const makeArt = createOffscreen ?? makeCanvas;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const topY = H * 0.2; // rim line (below the lid)
  const botY = H * 0.94; // base line
  const topR = W * 0.32; // rim radius
  const botR = W * 0.235; // base radius
  const rimE = topR * 0.26; // rim ellipse vertical radius
  const baseE = botR * 0.22; // base ellipse vertical radius
  const bodyH = botY - topY;

  // flat artwork buffer
  const artW = 900;
  const artH = 520;
  let art: HTMLCanvasElement | null = null;
  if (design) {
    art = makeArt(artW, artH);
    const actx = art.getContext("2d");
    if (actx) renderArtwork(actx as CanvasRenderingContext2D, design, artW, artH, logoImage);
  }
  const paper = design ? design.palette[2] : "#efe7db";

  // ---- ground shadow ----
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.beginPath();
  ctx.ellipse(cx, botY + baseE * 0.7, botR * 1.15, baseE * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ---- body silhouette path (used for clipping the artwork) ----
  function bodyPath() {
    ctx.beginPath();
    ctx.moveTo(cx - topR, topY);
    ctx.lineTo(cx - botR, botY);
    // rounded base front
    ctx.ellipse(cx, botY, botR, baseE, 0, Math.PI, 0, true);
    ctx.lineTo(cx + topR, topY);
    // rim back curve
    ctx.ellipse(cx, topY, topR, rimE, 0, 0, Math.PI, true);
    ctx.closePath();
  }

  // base paper fill
  ctx.save();
  bodyPath();
  ctx.fillStyle = paper;
  ctx.fill();
  ctx.restore();

  // ---- wrap artwork in vertical slices ----
  if (art) {
    ctx.save();
    bodyPath();
    ctx.clip();
    const slices = 160;
    for (let i = 0; i < slices; i++) {
      const t0 = i / slices;
      const t1 = (i + 1) / slices;
      const x0 = -1 + t0 * 2; // -1..1 normalized across cup
      const x1 = -1 + t1 * 2;
      // gentle cylinder mapping: compress source toward the edges
      const u0 = curveU(t0);
      const u1 = curveU(t1);
      const srcX = u0 * (artW - 1);
      const srcW = Math.max(1, (u1 - u0) * (artW - 1));

      const dxTop0 = cx + x0 * topR;
      const dxTop1 = cx + x1 * topR;
      const destW = dxTop1 - dxTop0 + 1;

      // slice quad follows the cone (top wider than bottom): approximate by
      // drawing into the trapezoidal column using a clip per slice.
      const dxBot0 = cx + x0 * botR;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(dxTop0, topY);
      ctx.lineTo(cx + x1 * topR, topY);
      ctx.lineTo(cx + x1 * botR, botY);
      ctx.lineTo(dxBot0, botY);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        art,
        srcX,
        0,
        srcW,
        artH,
        Math.min(dxTop0, dxBot0) - 1,
        topY - 1,
        Math.abs(destW) + Math.abs(dxTop0 - dxBot0) + 2,
        bodyH + 2
      );
      ctx.restore();
    }
    ctx.restore();
  }

  // ---- cylinder shading + highlight (clipped to body) ----
  ctx.save();
  bodyPath();
  ctx.clip();
  const shade = ctx.createLinearGradient(cx - topR, 0, cx + topR, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.34)");
  shade.addColorStop(0.28, "rgba(255,255,255,0.10)");
  shade.addColorStop(0.5, "rgba(255,255,255,0.02)");
  shade.addColorStop(0.72, "rgba(0,0,0,0.06)");
  shade.addColorStop(1, "rgba(0,0,0,0.40)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, topY - rimE, W, bodyH + rimE * 2);
  ctx.restore();

  // ---- rim (lip) ----
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, topY, topR, rimE, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = Math.max(1, W * 0.006);
  ctx.stroke();
  ctx.restore();

  // ---- lid (domed, sits on the rim) ----
  const lidTop = topY - rimE * 1.7;
  const lidR = topR * 1.03;
  // lid skirt
  const lidGrad = ctx.createLinearGradient(cx - lidR, 0, cx + lidR, 0);
  lidGrad.addColorStop(0, "#241c15");
  lidGrad.addColorStop(0.3, "#5a4a3b");
  lidGrad.addColorStop(0.55, "#4a3c2f");
  lidGrad.addColorStop(1, "#1c1610");
  ctx.fillStyle = lidGrad;
  ctx.beginPath();
  ctx.ellipse(cx, topY - rimE * 0.4, lidR, rimE * 1.05, 0, 0, Math.PI);
  ctx.lineTo(cx - lidR, topY - rimE * 0.4);
  ctx.closePath();
  ctx.fill();
  // lid dome top
  ctx.fillStyle = lidGrad;
  ctx.beginPath();
  ctx.ellipse(cx, lidTop, lidR, rimE * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  // dome shading
  const domeShade = ctx.createRadialGradient(
    cx - lidR * 0.35,
    lidTop - rimE * 0.3,
    rimE * 0.2,
    cx,
    lidTop,
    lidR
  );
  domeShade.addColorStop(0, "rgba(255,255,255,0.18)");
  domeShade.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = domeShade;
  ctx.beginPath();
  ctx.ellipse(cx, lidTop, lidR, rimE * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  // sip hole
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.ellipse(cx + lidR * 0.02, lidTop - rimE * 0.15, lidR * 0.16, rimE * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

// gentle cylinder curve: identity-ish in the middle, compressed at edges
function curveU(t: number): number {
  // blend linear with sine easing for a subtle wrap
  const s = 0.5 - 0.5 * Math.cos(t * Math.PI); // ease
  return t * 0.55 + s * 0.45;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
