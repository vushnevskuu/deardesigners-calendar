import {
  DEFAULT_HOMEPAGE_SETTINGS,
  DEFAULT_PUBLISH_SETTINGS,
} from "./demoData";
import type { CalendarProject, EventItem } from "./types";

const STORAGE_KEY = "dd-calendar-project-v1";

export function loadProject(): CalendarProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CalendarProject;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.events) || !Array.isArray(parsed.materials)) {
      return null;
    }
    return migrateProject(parsed);
  } catch (err) {
    console.warn("[dd-calendar] failed to load project", err);
    return null;
  }
}

export function saveProject(project: CalendarProject): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (err) {
    console.warn("[dd-calendar] failed to save project", err);
  }
}

export function clearProject(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// Мягкая миграция старых проектов в localStorage:
// добавляем homepageSettings/publishSettings и публикуем уже существующие
// события (они принадлежат админу клуба и считаются доверенными).
export function migrateProject(p: CalendarProject): CalendarProject {
  const homepageSettings = {
    ...DEFAULT_HOMEPAGE_SETTINGS,
    ...(p.homepageSettings ?? {}),
  };
  const publishSettings = {
    ...DEFAULT_PUBLISH_SETTINGS,
    ...(p.publishSettings ?? {}),
  };

  const events: EventItem[] = (p.events ?? []).map((e) => ({
    ...e,
    source: e.source ?? "manual",
    publishStatus: e.publishStatus ?? (e.source === "telegram" ? "draft" : "published"),
    published:
      typeof e.published === "boolean"
        ? e.published
        : e.source === "telegram"
          ? false
          : true,
    visibility: e.visibility ?? "public",
  }));

  return {
    ...p,
    events,
    homepageSettings,
    publishSettings,
    rawTelegramMessages: p.rawTelegramMessages ?? [],
    autofillDraft: p.autofillDraft ?? null,
  };
}
