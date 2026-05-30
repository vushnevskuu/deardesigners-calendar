import { toPng } from "html-to-image";
import type {
  CalendarProject,
  ExportPreset,
  ExportSettings,
  MaterialItem,
} from "./types";
import { EXPORT_PRESETS } from "./types";

export type ExportSize = { width: number; height: number | null };

export function presetSize(preset: ExportPreset): ExportSize {
  const found = EXPORT_PRESETS.find((p) => p.id === preset);
  if (!found) return { width: 1080, height: 1080 };
  return { width: found.w, height: found.h };
}

export async function exportNodeToPng(
  node: HTMLElement,
  settings: ExportSettings,
  fileName: string,
): Promise<void> {
  const { width, height } = presetSize(settings.preset);
  const pixelRatio = Math.max(1, Math.min(3, settings.scale || 2));
  const dataUrl = await toPng(node, {
    pixelRatio,
    cacheBust: true,
    width,
    height: height ?? undefined,
    canvasWidth: width,
    canvasHeight: height ?? undefined,
    backgroundColor: undefined,
  });
  triggerDownload(dataUrl, `${fileName}.png`);
}

export function exportProjectJson(project: CalendarProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${project.title || "calendar"}-${project.month}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportMaterialsJson(materials: MaterialItem[]): void {
  const blob = new Blob([JSON.stringify(materials, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `materials-${todayKey()}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function readJsonFile<T = unknown>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        resolve(JSON.parse(text) as T);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Не валидный JSON"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Ошибка чтения"));
    reader.readAsText(file);
  });
}

export function validateProject(input: unknown): input is CalendarProject {
  if (!input || typeof input !== "object") return false;
  const o = input as Record<string, unknown>;
  if (typeof o.month !== "string") return false;
  if (!Array.isArray(o.events)) return false;
  if (!Array.isArray(o.materials)) return false;
  return true;
}

export function validateMaterials(input: unknown): input is MaterialItem[] {
  if (!Array.isArray(input)) return false;
  return input.every(
    (m) =>
      m &&
      typeof m === "object" &&
      typeof (m as MaterialItem).id === "string" &&
      typeof (m as MaterialItem).title === "string",
  );
}

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function todayKey(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
