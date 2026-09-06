// Browser-side helper: decode a logo data URL into an HTMLImageElement and
// cache it, so re-renders (preview + export) are synchronous and flicker-free.

const cache = new Map<string, HTMLImageElement>();

export function getLogoImage(dataUrl?: string): HTMLImageElement | null {
  if (!dataUrl) return null;
  const cached = cache.get(dataUrl);
  if (cached && cached.complete && cached.naturalWidth > 0) return cached;
  return null;
}

// Preload a logo; resolves with the decoded image (also stored in the cache).
export function loadLogoImage(dataUrl: string): Promise<HTMLImageElement> {
  const cached = cache.get(dataUrl);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      cache.set(dataUrl, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Read a File into a resized PNG data URL (keeps payloads small for the DB and
// gives a clean transparent-friendly logo). Max edge ~512px.
export function fileToLogoDataUrl(file: File, maxEdge = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
