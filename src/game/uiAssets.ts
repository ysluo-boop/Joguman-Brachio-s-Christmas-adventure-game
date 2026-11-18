export const WELCOME_BG_URL = '/assets/aistudio/BG____36ab4dc4.jpeg';

export const UI_ASSET_URLS = {
  iconsSheet: '/src/assets/images/ui_icons_sheet_1794971471034.jpg',
  panelsSheet: '/src/assets/images/ui_panels_sheet_1794971471828.jpg',
  controlsSheet: '/src/assets/images/ui_controls_sheet_1794971471175.jpg',
  welcomeSheet: '/assets/aistudio/___65cf3be1.jpeg',
} as const;

export interface UiAssets {
  avatar: string;
  heart: string;
  santaHat: string;
  star: string;
  gift: string;
  snowflake: string;
  settingsGear: string;
  playButton: string;
  scrollBanner: string;
  redRibbon: string;
  brachioSantaBust: string;
  dialogPanel: string;
  btnLeft: string;
  btnRight: string;
  btnJump: string;
  btnAction: string;
  welcomeTitleLogo: string;
  welcomeStartButton: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load UI asset: ${src}`));
    img.src = src;
  });
}

function distSq(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

function sliceUiRect(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  cellW: number,
  cellH: number,
  options?: {
    tolerance?: number;
    feather?: number;
    seedCenter?: boolean;
    translucentDarkFillAlpha?: number;
  }
): string {
  const tolerance = options?.tolerance ?? 28;
  const feather = options?.feather ?? 44;

  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';

  ctx.drawImage(img, sx, sy, cellW, cellH, 0, 0, cellW, cellH);
  const imageData = ctx.getImageData(0, 0, cellW, cellH);
  const data = imageData.data;

  // Sample average corner color (solid gray backdrop)
  const corners = [
    [3, 3],
    [cellW - 4, 3],
    [3, cellH - 4],
    [cellW - 4, cellH - 4],
  ];
  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  for (const [cx, cy] of corners) {
    const idx = (cy * cellW + cx) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR /= corners.length;
  bgG /= corners.length;
  bgB /= corners.length;

  const tolSq = tolerance * tolerance;
  const featherSq = feather * feather;
  const visited = new Uint8Array(cellW * cellH);
  const bgMask = new Uint8Array(cellW * cellH);
  const queue = new Int32Array(cellW * cellH);
  let head = 0;
  let tail = 0;

  const tryEnqueue = (x: number, y: number) => {
    if (x < 0 || x >= cellW || y < 0 || y >= cellH) return;
    const p = y * cellW + x;
    if (visited[p]) return;
    const idx = p * 4;
    if (distSq(data[idx], data[idx + 1], data[idx + 2], bgR, bgG, bgB) <= tolSq) {
      visited[p] = 1;
      bgMask[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < cellW; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, cellH - 1);
  }
  for (let y = 0; y < cellH; y++) {
    tryEnqueue(0, y);
    tryEnqueue(cellW - 1, y);
  }
  if (options?.seedCenter) {
    tryEnqueue(Math.floor(cellW / 2), Math.floor(cellH / 2));
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % cellW;
    const y = (p - x) / cellW;
    tryEnqueue(x - 1, y);
    tryEnqueue(x + 1, y);
    tryEnqueue(x, y - 1);
    tryEnqueue(x, y + 1);
  }

  for (let p = 0; p < cellW * cellH; p++) {
    const idx = p * 4;
    if (bgMask[p]) {
      data[idx + 3] = 0;
    } else {
      const d = distSq(data[idx], data[idx + 1], data[idx + 2], bgR, bgG, bgB);
      if (d < featherSq) {
        const x = p % cellW;
        const y = (p - x) / cellW;
        const hasBg =
          (x > 0 && bgMask[p - 1]) ||
          (x < cellW - 1 && bgMask[p + 1]) ||
          (y > 0 && bgMask[p - cellW]) ||
          (y < cellH - 1 && bgMask[p + cellW]);
        if (hasBg) {
          const t = Math.max(0, Math.min(1, (Math.sqrt(d) - tolerance) / (feather - tolerance)));
          data[idx + 3] = Math.round(t * 255);
        }
      }

      if (
        options?.translucentDarkFillAlpha !== undefined &&
        data[idx + 3] > 200
      ) {
        const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (lum < 120) {
          data[idx + 3] = options.translucentDarkFillAlpha;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Tight crop to opaque bounding box
  let minX = cellW;
  let minY = cellH;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      if (data[(y * cellW + x) * 4 + 3] > 14) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return canvas.toDataURL('image/png');
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = cropW;
  out.height = cropH;
  const oCtx = out.getContext('2d');
  if (oCtx) {
    oCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  }
  return out.toDataURL('image/png');
}

function sliceUiCell(
  img: HTMLImageElement,
  col: number,
  row: number,
  cols: number,
  rows: number,
  options?: {
    tolerance?: number;
    feather?: number;
    seedCenter?: boolean;
    translucentDarkFillAlpha?: number;
  }
): string {
  const cellW = Math.floor(img.naturalWidth / cols);
  const cellH = Math.floor(img.naturalHeight / rows);
  return sliceUiRect(img, col * cellW, row * cellH, cellW, cellH, options);
}

let cachedUiAssetsPromise: Promise<UiAssets> | null = null;

export function loadUiAssets(): Promise<UiAssets> {
  if (cachedUiAssetsPromise) return cachedUiAssetsPromise;

  cachedUiAssetsPromise = (async () => {
    const [iconsImg, panelsImg, controlsImg, welcomeImg] = await Promise.all([
      loadImage(UI_ASSET_URLS.iconsSheet),
      loadImage(UI_ASSET_URLS.panelsSheet),
      loadImage(UI_ASSET_URLS.controlsSheet),
      loadImage(UI_ASSET_URLS.welcomeSheet),
    ]);

    return {
      avatar: sliceUiCell(iconsImg, 0, 0, 4, 2),
      heart: sliceUiCell(iconsImg, 1, 0, 4, 2),
      santaHat: sliceUiCell(iconsImg, 2, 0, 4, 2),
      star: sliceUiCell(iconsImg, 3, 0, 4, 2),
      gift: sliceUiCell(iconsImg, 0, 1, 4, 2),
      snowflake: sliceUiCell(iconsImg, 1, 1, 4, 2),
      settingsGear: sliceUiCell(iconsImg, 2, 1, 4, 2, { seedCenter: true }),
      playButton: sliceUiCell(iconsImg, 3, 1, 4, 2),
      scrollBanner: sliceUiCell(panelsImg, 0, 0, 2, 2),
      redRibbon: sliceUiCell(panelsImg, 1, 0, 2, 2),
      brachioSantaBust: sliceUiCell(panelsImg, 0, 1, 2, 2),
      dialogPanel: sliceUiCell(panelsImg, 1, 1, 2, 2),
      btnLeft: sliceUiCell(controlsImg, 0, 0, 2, 2, { translucentDarkFillAlpha: 185 }),
      btnRight: sliceUiCell(controlsImg, 1, 0, 2, 2, { translucentDarkFillAlpha: 185 }),
      btnJump: sliceUiCell(controlsImg, 0, 1, 2, 2, { translucentDarkFillAlpha: 185 }),
      btnAction: sliceUiCell(controlsImg, 1, 1, 2, 2, { translucentDarkFillAlpha: 185 }),
      welcomeTitleLogo: sliceUiRect(welcomeImg, 360, 100, 940, 420, {
        tolerance: 26,
        feather: 40,
      }),
      welcomeStartButton: sliceUiRect(welcomeImg, 540, 600, 590, 230, {
        tolerance: 26,
        feather: 40,
      }),
    };
  })();

  return cachedUiAssetsPromise;
}
