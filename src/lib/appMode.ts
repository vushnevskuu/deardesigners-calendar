import type {
  AppMode,
  CalendarPresentationMode,
  EmbedQuerySettings,
  EmbedTheme,
} from "./types";

export type AppModeContext = {
  mode: AppMode;
  query: URLSearchParams;
  // Параметры URL, которые могут переопределить настройки homepage.
  monthOverride?: string; // YYYY-MM
  presentationOverride?: CalendarPresentationMode;
  // Поверхностные query-настройки для iframe-режимов (embed/homepage/digest).
  // Не сохраняются в проект и не влияют на admin.
  settings: EmbedQuerySettings;
};

const VALID_MODES: AppMode[] = [
  "admin",
  "homepage",
  "embed",
  "digest",
  "export-preview",
];

const VALID_PRESENTATIONS: CalendarPresentationMode[] = [
  "upcoming",
  "monthly-digest",
  "archive",
];

const VALID_VIEWS: EmbedQuerySettings["view"][] = [
  "calendar",
  "digest",
  "compact",
];

const VALID_THEMES: EmbedTheme[] = ["light", "clean", "paper"];

// Безопасный парсер бул-флага: true/1/yes → true, false/0/no → false, иначе undefined.
function parseBoolFlag(raw: string | null): boolean | undefined {
  if (raw == null) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes" || v === "on") return true;
  if (v === "false" || v === "0" || v === "no" || v === "off") return false;
  return undefined;
}

function parseSettings(query: URLSearchParams): EmbedQuerySettings {
  const settings: EmbedQuerySettings = {};

  const viewRaw = query.get("view");
  if (viewRaw && (VALID_VIEWS as string[]).includes(viewRaw)) {
    settings.view = viewRaw as EmbedQuerySettings["view"];
  }

  const compact = parseBoolFlag(query.get("compact"));
  if (compact !== undefined) settings.compact = compact;

  const showPast = parseBoolFlag(query.get("showPast"));
  if (showPast !== undefined) settings.showPast = showPast;

  const showMaterials = parseBoolFlag(query.get("showMaterials"));
  if (showMaterials !== undefined) settings.showMaterials = showMaterials;

  const showTelegram = parseBoolFlag(query.get("showTelegramLinks"));
  if (showTelegram !== undefined) settings.showTelegramLinks = showTelegram;

  const themeRaw = query.get("theme");
  if (themeRaw && (VALID_THEMES as string[]).includes(themeRaw)) {
    settings.theme = themeRaw as EmbedTheme;
  }

  const heightRaw = query.get("height");
  if (heightRaw === "auto" || heightRaw === "fixed") {
    settings.height = heightRaw;
  }

  return settings;
}

// Определяем, в каком режиме открыт фронтенд календаря.
// Источники приоритета:
// 1. ?mode=... в URL (главный источник для встроек на Tilda)
// 2. префикс пути: /embed, /homepage, /digest, /export
// 3. дефолт — admin (локальная разработка / админ-панель)
export function detectAppMode(): AppModeContext {
  if (typeof window === "undefined") {
    return {
      mode: "admin",
      query: new URLSearchParams(),
      settings: {},
    };
  }

  const url = new URL(window.location.href);
  const query = url.searchParams;

  let mode: AppMode = "admin";

  const queryMode = query.get("mode");
  if (queryMode && (VALID_MODES as string[]).includes(queryMode)) {
    mode = queryMode as AppMode;
  } else {
    const path = url.pathname.toLowerCase();
    if (path.startsWith("/embed")) mode = "embed";
    else if (path.startsWith("/digest")) mode = "digest";
    else if (path.startsWith("/homepage")) mode = "homepage";
    else if (path.startsWith("/export")) mode = "export-preview";
  }

  // Дополнительные query-параметры
  const monthRaw = query.get("month");
  const monthOverride =
    monthRaw && /^\d{4}-\d{2}$/.test(monthRaw) ? monthRaw : undefined;

  const presentationRaw = query.get("presentation") ?? query.get("digest");
  let presentationOverride: CalendarPresentationMode | undefined;
  if (mode === "digest") {
    // /digest всегда = monthly-digest, даже без явного presentation.
    presentationOverride = "monthly-digest";
  } else if (
    presentationRaw &&
    (VALID_PRESENTATIONS as string[]).includes(presentationRaw)
  ) {
    presentationOverride = presentationRaw as CalendarPresentationMode;
  } else if (presentationRaw === "true" || presentationRaw === "1") {
    presentationOverride = "monthly-digest";
  }

  const settings = parseSettings(query);
  // ?view=digest — синоним «сделать встроенный календарь дайджестом».
  if (settings.view === "digest" && !presentationOverride) {
    presentationOverride = "monthly-digest";
  }

  return {
    mode,
    query,
    monthOverride,
    presentationOverride,
    settings,
  };
}
