const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.86;

export async function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Не картинка");
  }
  const buffer = await readAsDataUrl(file);
  return normalizeImageDataUrl(buffer);
}

export async function clipboardItemToDataUrl(
  items: DataTransferItemList | null | undefined,
): Promise<string | null> {
  if (!items) return null;
  for (const item of Array.from(items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) {
        return await fileToDataUrl(file);
      }
    }
  }
  return null;
}

export async function filesFromDropToDataUrl(
  files: FileList | null | undefined,
): Promise<string | null> {
  if (!files || files.length === 0) return null;
  for (const file of Array.from(files)) {
    if (file.type.startsWith("image/")) {
      return await fileToDataUrl(file);
    }
  }
  return null;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("Не удалось прочитать файл"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Ошибка чтения"));
    reader.readAsDataURL(file);
  });
}

async function normalizeImageDataUrl(dataUrl: string): Promise<string> {
  try {
    const img = await loadImage(dataUrl);
    const { width, height } = img;
    const max = Math.max(width, height);
    if (max <= MAX_SIDE) {
      // Если PNG больше пары мегабайт — пережмём в jpeg
      if (dataUrl.length > 2_500_000) {
        return safeReencode(img, width, height, dataUrl);
      }
      return dataUrl;
    }
    const ratio = MAX_SIDE / max;
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    return safeReencode(img, w, h, dataUrl);
  } catch (err) {
    console.warn("[dd-calendar] image normalize failed, using original", err);
    return dataUrl;
  }
}

function safeReencode(
  img: HTMLImageElement,
  w: number,
  h: number,
  fallback: string,
): string {
  try {
    const out = reencode(img, w, h);
    if (!out || out.length < 64 || out === "data:,") return fallback;
    return out;
  } catch (err) {
    console.warn("[dd-calendar] reencode failed, using original", err);
    return fallback;
  }
}

function reencode(img: HTMLImageElement, w: number, h: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return img.src;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export type ImageAnalysis = {
  width: number;
  height: number;
  aspectRatio: number;
  dominantColor: string;
  averageColor: string;
  brightness: number; // 0–255
  saturation: number; // 0–1
  isMostlyLight: boolean;
  isMostlyWhite: boolean;
  looksLikeScreenshot: boolean;
  recommendedFit: "cover" | "contain";
  recommendedBackgroundMode: "blurred-fill" | "dominant-color" | "solid";
};

const FIT_FALLBACK: ImageAnalysis = {
  width: 0,
  height: 0,
  aspectRatio: 1,
  dominantColor: "#111111",
  averageColor: "#111111",
  brightness: 60,
  saturation: 0,
  isMostlyLight: false,
  isMostlyWhite: false,
  looksLikeScreenshot: false,
  recommendedFit: "cover",
  recommendedBackgroundMode: "dominant-color",
};

// Если соотношение картинки далеко от квадрата (примерно 1:1) — нужен contain
// и блюр/доминантный фон, чтобы не обрезать важные части.
const COVER_AR_MIN = 0.78; // ниже — портретная, contain
const COVER_AR_MAX = 1.28; // выше — широкая, contain

export async function analyzeImageDataUrl(
  dataUrl: string,
): Promise<ImageAnalysis> {
  try {
    const img = await loadImage(dataUrl);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return FIT_FALLBACK;
    const aspectRatio = width / height;

    const stats = sampleImageStats(img);
    const averageColor = stats?.averageColor ?? "#111111";
    const brightness = stats?.brightness ?? 60;
    const saturation = stats?.saturation ?? 0;
    const dominantColor = stats?.dominantColor ?? averageColor;

    // Эвристики «светлоты» и «скриншотности».
    const isMostlyLight = brightness > 220;
    const isMostlyWhite = brightness > 235 && saturation < 0.12;
    const looksLikeScreenshot = isMostlyLight && saturation < 0.18;

    const recommendedFit: "cover" | "contain" =
      aspectRatio > COVER_AR_MAX || aspectRatio < COVER_AR_MIN
        ? "contain"
        : "cover";

    let recommendedBackgroundMode: ImageAnalysis["recommendedBackgroundMode"];
    if (isMostlyWhite || looksLikeScreenshot) {
      // Светлая/белая картинка: blur даст серую дымку — используем чистый фон.
      recommendedBackgroundMode = "solid";
    } else if (isMostlyLight) {
      // Светлая, но цветная — мягкий доминантный цвет.
      recommendedBackgroundMode = "dominant-color";
    } else {
      // Обычные тёмные/насыщенные — blur-fill красивее.
      recommendedBackgroundMode = "blurred-fill";
    }

    // Для солидного фона у скриншота лучше брать чистый белый или очень светлый.
    let solidColor = dominantColor;
    if (recommendedBackgroundMode === "solid") {
      if (isMostlyWhite) {
        solidColor = "#ffffff";
      } else if (brightness > 245) {
        solidColor = "#ffffff";
      } else {
        // Поднимаем яркость доминантного цвета почти до белого, чтобы не было серости.
        solidColor = lighten(dominantColor, 0.7);
      }
    }

    return {
      width,
      height,
      aspectRatio,
      dominantColor: solidColor,
      averageColor,
      brightness,
      saturation,
      isMostlyLight,
      isMostlyWhite,
      looksLikeScreenshot,
      recommendedFit,
      recommendedBackgroundMode,
    };
  } catch (err) {
    console.warn("[dd-calendar] analyzeImageDataUrl failed", err);
    return FIT_FALLBACK;
  }
}

type SampleStats = {
  averageColor: string;
  dominantColor: string;
  brightness: number;
  saturation: number;
};

function sampleImageStats(img: HTMLImageElement): SampleStats | null {
  try {
    const SIZE = 32;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    // Гистограмма «крупных» цветовых корзин для приблизительного dominant color.
    const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 16) continue;
      const cr = data[i];
      const cg = data[i + 1];
      const cb = data[i + 2];
      r += cr;
      g += cg;
      b += cb;
      count += 1;
      const key = `${cr >> 5}-${cg >> 5}-${cb >> 5}`;
      const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
      cur.r += cr;
      cur.g += cg;
      cur.b += cb;
      cur.n += 1;
      buckets.set(key, cur);
    }
    if (count === 0) return null;

    const avgR = Math.round(r / count);
    const avgG = Math.round(g / count);
    const avgB = Math.round(b / count);
    const averageColor = rgbToHex(avgR, avgG, avgB);

    // Доминантный = самая большая корзина (но не белые/чёрные пиксели,
    // если есть альтернатива). В простом случае — берём топ-1.
    let topKey = "";
    let topN = 0;
    buckets.forEach((v, k) => {
      if (v.n > topN) {
        topN = v.n;
        topKey = k;
      }
    });
    let dominantColor = averageColor;
    const top = buckets.get(topKey);
    if (top && top.n > 0) {
      dominantColor = rgbToHex(
        Math.round(top.r / top.n),
        Math.round(top.g / top.n),
        Math.round(top.b / top.n),
      );
    }

    // Перцептуальная яркость по Rec. 601.
    const brightness = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

    // Приблизительная насыщенность по HSL.
    const max = Math.max(avgR, avgG, avgB) / 255;
    const min = Math.min(avgR, avgG, avgB) / 255;
    const lightness = (max + min) / 2;
    let saturation = 0;
    const delta = max - min;
    if (delta > 0) {
      saturation =
        lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    }

    return {
      averageColor,
      dominantColor,
      brightness,
      saturation,
    };
  } catch (err) {
    console.warn("[dd-calendar] sampleImageStats failed", err);
    return null;
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-fA-F0-9]{6})$/.exec(hex.trim());
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  const k = Math.max(0, Math.min(1, amount));
  return rgbToHex(
    Math.round(r + (255 - r) * k),
    Math.round(g + (255 - g) * k),
    Math.round(b + (255 - b) * k),
  );
}
