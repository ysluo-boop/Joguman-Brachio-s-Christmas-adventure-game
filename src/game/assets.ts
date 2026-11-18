export const ASSET_URLS = {
  brachioSheet: '/src/assets/images/brachio_sprite_sheet_1794969769311.jpg',
  brachioWalk1x4: '/src/assets/images/joguman_brachio_walk_1x4_1794972127805.jpg',
  brachioPortrait: '/src/assets/images/brachio_portrait_1794969771165.jpg',
  propsSheet: '/src/assets/images/enemies_and_props_sheet_1794969770786.jpg',
  backgroundScene: '/assets/aistudio/Max_a_Remove_all_character_edabcdde.jpeg',
} as const;

export interface SpriteFrame {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface GameAssets {
  brachio: {
    idle1: SpriteFrame;
    idle2: SpriteFrame;
    walk1: SpriteFrame;
    walk2: SpriteFrame;
    walkCycle: SpriteFrame[];
    jump: SpriteFrame;
    fall: SpriteFrame;
    action: SpriteFrame;
    victory: SpriteFrame;
  };
  props: {
    snowman1: SpriteFrame;
    snowman2: SpriteFrame;
    star: SpriteFrame;
    gift: SpriteFrame;
    snowflake: SpriteFrame;
    dustPuff: SpriteFrame;
  };
  backgroundScene: HTMLImageElement;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load asset: ${src}`));
    img.src = src;
  });
}

function colorDistSq(
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

/**
 * Edge-seeded flood-fill background removal for a single sprite cell.
 * Preserves interior white/light colors (like snowmen and Santa hat fur)
 * while removing uniform backgrounds and faint slate drop-shadows.
 */
function extractCellSprite(
  img: HTMLImageElement,
  col: number,
  row: number,
  cols: number,
  rows: number,
  options: {
    tolerance: number;
    feather: number;
    keepMultipleComponents?: boolean;
  }
): SpriteFrame {
  const cellW = Math.floor(img.naturalWidth / cols);
  const cellH = Math.floor(img.naturalHeight / rows);
  const sx = col * cellW;
  const sy = row * cellH;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cellW;
  tempCanvas.height = cellH;
  const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tCtx) {
    return { canvas: tempCanvas, width: cellW, height: cellH };
  }

  tCtx.drawImage(img, sx, sy, cellW, cellH, 0, 0, cellW, cellH);
  const imageData = tCtx.getImageData(0, 0, cellW, cellH);
  const data = imageData.data;

  // Sample average corner background RGB
  const sampleCoords = [
    [2, 2],
    [cellW - 3, 2],
    [2, cellH - 3],
    [cellW - 3, cellH - 3],
  ];
  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  for (const [cx, cy] of sampleCoords) {
    const idx = (cy * cellW + cx) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR /= sampleCoords.length;
  bgG /= sampleCoords.length;
  bgB /= sampleCoords.length;

  const tolSq = options.tolerance * options.tolerance;
  const featherSq = options.feather * options.feather;
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
    const dist = colorDistSq(data[idx], data[idx + 1], data[idx + 2], bgR, bgG, bgB);
    if (dist <= tolSq) {
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

  while (head < tail) {
    const p = queue[head++];
    const x = p % cellW;
    const y = (p - x) / cellW;
    tryEnqueue(x - 1, y);
    tryEnqueue(x + 1, y);
    tryEnqueue(x, y - 1);
    tryEnqueue(x, y + 1);
  }

  // Apply transparency and soft edge feathering on neighbors of background
  for (let p = 0; p < cellW * cellH; p++) {
    const idx = p * 4;
    if (bgMask[p]) {
      data[idx + 3] = 0;
    } else {
      const dist = colorDistSq(data[idx], data[idx + 1], data[idx + 2], bgR, bgG, bgB);
      if (dist < featherSq) {
        const x = p % cellW;
        const y = (p - x) / cellW;
        const hasBgNeighbor =
          (x > 0 && bgMask[p - 1]) ||
          (x < cellW - 1 && bgMask[p + 1]) ||
          (y > 0 && bgMask[p - cellW]) ||
          (y < cellH - 1 && bgMask[p + cellW]);
        if (hasBgNeighbor) {
          const t = Math.max(
            0,
            Math.min(1, (Math.sqrt(dist) - options.tolerance) / (options.feather - options.tolerance))
          );
          data[idx + 3] = Math.round(t * 255);
        }
      }
    }
  }

  // Filter out tiny disconnected specks unless keepMultipleComponents is true
  if (!options.keepMultipleComponents) {
    const compId = new Int32Array(cellW * cellH);
    const compSizes: number[] = [0];
    let currentComp = 0;
    const compQueue = new Int32Array(cellW * cellH);

    for (let p = 0; p < cellW * cellH; p++) {
      if (data[p * 4 + 3] > 20 && compId[p] === 0) {
        currentComp++;
        let size = 0;
        let qh = 0;
        let qt = 0;
        compId[p] = currentComp;
        compQueue[qt++] = p;
        while (qh < qt) {
          const cp = compQueue[qh++];
          size++;
          const cx = cp % cellW;
          const cy = (cp - cx) / cellW;
          const neighbors = [
            cx > 0 ? cp - 1 : -1,
            cx < cellW - 1 ? cp + 1 : -1,
            cy > 0 ? cp - cellW : -1,
            cy < cellH - 1 ? cp + cellW : -1,
          ];
          for (const np of neighbors) {
            if (np >= 0 && data[np * 4 + 3] > 20 && compId[np] === 0) {
              compId[np] = currentComp;
              compQueue[qt++] = np;
            }
          }
        }
        compSizes[currentComp] = size;
      }
    }

    let maxComp = 0;
    let maxSize = 0;
    for (let c = 1; c < compSizes.length; c++) {
      if (compSizes[c] > maxSize) {
        maxSize = compSizes[c];
        maxComp = c;
      }
    }

    for (let p = 0; p < cellW * cellH; p++) {
      if (compId[p] !== 0 && compId[p] !== maxComp && compSizes[compId[p]] < maxSize * 0.15) {
        data[p * 4 + 3] = 0;
      }
    }
  }

  tCtx.putImageData(imageData, 0, 0);

  // Tight bounding box crop
  let minX = cellW;
  let minY = cellH;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      if (data[(y * cellW + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { canvas: tempCanvas, width: cellW, height: cellH };
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;
  const cCtx = croppedCanvas.getContext('2d');
  if (cCtx) {
    cCtx.drawImage(tempCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  }

  return { canvas: croppedCanvas, width: cropW, height: cropH };
}

/**
 * Removes uniform sky/slate upper backdrop from panoramic parallax layers
 * using top-edge-seeded flood fill.
 */
function keyParallaxLayer(
  img: HTMLImageElement,
  tolerance: number,
  feather: number
): HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Sample top row center & corners
  const samples = [
    [4, 4],
    [Math.floor(w * 0.25), 4],
    [Math.floor(w * 0.5), 4],
    [Math.floor(w * 0.75), 4],
    [w - 5, 4],
  ];
  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  for (const [sx, sy] of samples) {
    const idx = (sy * w + sx) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR /= samples.length;
  bgG /= samples.length;
  bgB /= samples.length;

  const tolSq = tolerance * tolerance;
  const featherSq = feather * feather;
  const visited = new Uint8Array(w * h);
  const bgMask = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const enqueue = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const p = y * w + x;
    if (visited[p]) return;
    const idx = p * 4;
    const d = colorDistSq(data[idx], data[idx + 1], data[idx + 2], bgR, bgG, bgB);
    if (d <= tolSq) {
      visited[p] = 1;
      bgMask[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
  }
  for (let y = 0; y < Math.floor(h * 0.65); y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    const y = (p - x) / w;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  for (let p = 0; p < w * h; p++) {
    const idx = p * 4;
    if (bgMask[p]) {
      data[idx + 3] = 0;
    } else {
      const d = colorDistSq(data[idx], data[idx + 1], data[idx + 2], bgR, bgG, bgB);
      if (d < featherSq) {
        const x = p % w;
        const y = (p - x) / w;
        const hasBg =
          (x > 0 && bgMask[p - 1]) ||
          (x < w - 1 && bgMask[p + 1]) ||
          (y > 0 && bgMask[p - w]) ||
          (y < h - 1 && bgMask[p + w]);
        if (hasBg) {
          const t = Math.max(0, Math.min(1, (Math.sqrt(d) - tolerance) / (feather - tolerance)));
          data[idx + 3] = Math.round(t * 255);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

let cachedAssetsPromise: Promise<GameAssets> | null = null;

export function loadGameAssets(): Promise<GameAssets> {
  if (cachedAssetsPromise) return cachedAssetsPromise;

  cachedAssetsPromise = (async () => {
    const [walk1x4Img, propsImg, bgSceneImg] = await Promise.all([
      loadImage(ASSET_URLS.brachioWalk1x4),
      loadImage(ASSET_URLS.propsSheet),
      loadImage(ASSET_URLS.backgroundScene),
    ]);

    const walkWhiteOpts = { tolerance: 30, feather: 52, keepMultipleComponents: false };
    const propOpts = { tolerance: 40, feather: 58, keepMultipleComponents: false };

    const walkCycle = [0, 1, 2, 3].map((col) =>
      extractCellSprite(walk1x4Img, col, 0, 4, 1, walkWhiteOpts)
    );

    const assets: GameAssets = {
      brachio: {
        idle1: walkCycle[0],
        idle2: walkCycle[1],
        walk1: walkCycle[0],
        walk2: walkCycle[2],
        walkCycle,
        jump: walkCycle[3],
        fall: walkCycle[1],
        action: walkCycle[3],
        victory: walkCycle[3],
      },
      props: {
        snowman1: extractCellSprite(propsImg, 0, 0, 4, 2, propOpts),
        snowman2: extractCellSprite(propsImg, 1, 0, 4, 2, propOpts),
        star: extractCellSprite(propsImg, 2, 0, 4, 2, propOpts),
        gift: extractCellSprite(propsImg, 3, 0, 4, 2, propOpts),
        snowflake: extractCellSprite(propsImg, 0, 1, 4, 2, propOpts),
        dustPuff: extractCellSprite(propsImg, 3, 1, 4, 2, {
          tolerance: 40,
          feather: 58,
          keepMultipleComponents: true,
        }),
      },
      backgroundScene: bgSceneImg,
    };

    return assets;
  })();

  return cachedAssetsPromise;
}
