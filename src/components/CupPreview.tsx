"use client";

import { useEffect, useRef, useState } from "react";
import { DesignSpec } from "@/lib/design";
import { drawCup } from "@/lib/cup";
import { getLogoImage, loadLogoImage } from "@/lib/logo";

// Renders the design wrapped onto a realistic paper-cup silhouette. Drawn at
// devicePixelRatio for crisp output at any size (used for the live preview and
// the history thumbnails). If the design carries a logo data URL it is decoded
// and drawn into the label band.
export default function CupPreview({
  design,
  size = 360,
}: {
  design: DesignSpec | null;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoReady, setLogoReady] = useState(0);

  // preload the logo when it changes so the redraw has it available
  useEffect(() => {
    if (design?.logo && !getLogoImage(design.logo)) {
      loadLogoImage(design.logo)
        .then(() => setLogoReady((n) => n + 1))
        .catch(() => {});
    }
  }, [design?.logo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = size;
    const H = size * 1.2;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const logo = getLogoImage(design?.logo);
    drawCup(ctx, design, W, H, undefined, logo);
  }, [design, size, logoReady]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Live-превью стакана"
      style={{ display: "block", margin: "0 auto", filter: "drop-shadow(0 20px 36px rgba(0,0,0,0.5))" }}
    />
  );
}
