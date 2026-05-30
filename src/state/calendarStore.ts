import { nanoid } from "nanoid";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { shiftMonth, formatISODate } from "../lib/calendar";
import { parseTelegramMessages } from "../lib/chatParser";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  DEFAULT_PUBLISH_SETTINGS,
  buildDemoProject,
  buildEmptyProject,
} from "../lib/demoData";
import { analyzeImageDataUrl } from "../lib/image";
import { loadProject, migrateProject, saveProject } from "../lib/storage";
import type {
  AutoDetectedEvent,
  CalendarProject,
  CalendarPublishSettings,
  EventItem,
  EventType,
  ExportSettings,
  HomepageSettings,
  MaterialItem,
  MonthlyAutofillDraft,
  PublishStatus,
  ThemeSettings,
  ToastItem,
  VisibilityMode,
} from "../lib/types";

type State = {
  project: CalendarProject;
  selectedDate: string | null;
  selectedEventId: string | null;
  editorOpen: boolean;
  editorMode: "create" | "edit";
  materialsOpen: boolean;
  exportOpen: boolean;
  toasts: ToastItem[];
  bootstrapped: boolean;
};

type Actions = {
  bootstrap: () => void;
  setProject: (p: CalendarProject) => void;
  setMonth: (monthKey: string) => void;
  shiftMonthBy: (delta: number) => void;
  setProjectTitle: (title: string) => void;

  selectDate: (iso: string | null) => void;
  selectEvent: (id: string | null) => void;

  openEditor: (mode: "create" | "edit", payload?: { date?: string; eventId?: string }) => void;
  closeEditor: () => void;
  openMaterials: () => void;
  closeMaterials: () => void;
  openExport: () => void;
  closeExport: () => void;

  addEvent: (partial: Partial<EventItem> & { date: string }) => EventItem;
  updateEvent: (id: string, patch: Partial<EventItem>) => void;
  removeEvent: (id: string) => void;
  setEventImage: (id: string, dataUrl: string | undefined) => void;

  attachImageToDate: (iso: string, dataUrl: string) => Promise<void>;
  pasteImage: (dataUrl: string) => Promise<void>;

  addMaterial: (partial?: Partial<MaterialItem>) => MaterialItem;
  updateMaterial: (id: string, patch: Partial<MaterialItem>) => void;
  removeMaterial: (id: string) => void;

  attachMaterialToEvent: (eventId: string, materialId: string) => void;
  detachMaterialFromEvent: (eventId: string, materialId: string) => void;
  dropMaterialOnDate: (iso: string, materialId: string) => void;
  dropMaterialOnEvent: (eventId: string, materialId: string) => void;

  setTheme: (patch: Partial<ThemeSettings>) => void;
  setExportSettings: (patch: Partial<ExportSettings>) => void;

  setHomepageSettings: (patch: Partial<HomepageSettings>) => void;
  setPublishSettings: (patch: Partial<CalendarPublishSettings>) => void;

  setEventPublishStatus: (id: string, status: PublishStatus) => void;
  setEventVisibility: (id: string, visibility: VisibilityMode) => void;
  publishEvent: (id: string) => void;
  unpublishEvent: (id: string) => void;

  generateAutofillDraft: (monthKey?: string) => MonthlyAutofillDraft | null;
  clearAutofillDraft: () => void;
  approveAutofillEvent: (
    detectedId: string,
    overrides?: Partial<EventItem>,
  ) => EventItem | null;
  rejectAutofillEvent: (detectedId: string) => void;
  importAllAutofill: (monthKey: string) => number;

  importProject: (incoming: CalendarProject) => void;
  importMaterials: (materials: MaterialItem[]) => void;
  resetDemo: () => void;

  pushToast: (message: string, tone?: ToastItem["tone"]) => void;
  dismissToast: (id: string) => void;
};

const INITIAL_PROJECT = buildDemoProject();

export const useCalendarStore = create<State & Actions>()(
  subscribeWithSelector((set, get) => ({
    project: INITIAL_PROJECT,
    selectedDate: null,
    selectedEventId: null,
    editorOpen: false,
    editorMode: "create",
    materialsOpen: false,
    exportOpen: false,
    toasts: [],
    bootstrapped: false,

    bootstrap: () => {
      if (get().bootstrapped) return;
      const stored = loadProject();
      if (stored) {
        const migrated = migrateProject(stored);
        // 1) Чистим битые raw-image события без картинки.
        // 2) Мигрируем старые «безымянные» photo-события с картинкой
        //    в raw-image (раньше attachImageToDate создавал такие как photo).
        const cleaned: CalendarProject = {
          ...migrated,
          events: migrated.events
            .filter(
              (e) =>
                !(
                  e.cardStyle === "raw-image" &&
                  !isValidImageDataUrl(e.imageDataUrl)
                ),
            )
            .map((e) => {
              const isUntitled =
                !e.title?.trim() ||
                e.title.trim().toLowerCase() === "без названия";
              const hasDescription = Boolean(e.description?.trim());
              const noLinks = !e.relatedMaterialIds?.length;
              const hasContent = !isUntitled || hasDescription || !noLinks;

              // Если событие raw-image, но появился контент — возвращаем в photo,
              // чтобы текст снова отрисовался поверх картинки.
              if (
                e.cardStyle === "raw-image" &&
                hasContent &&
                isValidImageDataUrl(e.imageDataUrl)
              ) {
                return { ...e, cardStyle: "photo" };
              }
              // Старые «безымянные» photo-события без контента — в raw-image.
              if (
                e.cardStyle === "photo" &&
                isValidImageDataUrl(e.imageDataUrl) &&
                !hasContent
              ) {
                return { ...e, cardStyle: "raw-image", title: "" };
              }
              return e;
            }),
        };
        set({ project: cleaned, bootstrapped: true });
      } else {
        set({ bootstrapped: true });
        saveProject(get().project);
      }
    },

    setProject: (p) => set({ project: touch(p) }),

    setMonth: (monthKey) =>
      set((s) => ({
        project: touch({ ...s.project, month: monthKey }),
        selectedDate: null,
        selectedEventId: null,
      })),

    shiftMonthBy: (delta) =>
      set((s) => ({
        project: touch({ ...s.project, month: shiftMonth(s.project.month, delta) }),
        selectedDate: null,
        selectedEventId: null,
      })),

    setProjectTitle: (title) =>
      set((s) => ({ project: touch({ ...s.project, title }) })),

    selectDate: (iso) => set({ selectedDate: iso }),
    selectEvent: (id) => set({ selectedEventId: id }),

    openEditor: (mode, payload) =>
      set((s) => {
        if (mode === "edit" && payload?.eventId) {
          const ev = s.project.events.find((e) => e.id === payload.eventId);
          if (!ev) return s;
          return {
            editorOpen: true,
            editorMode: "edit",
            selectedEventId: ev.id,
            selectedDate: ev.date,
          };
        }
        return {
          editorOpen: true,
          editorMode: "create",
          selectedDate: payload?.date ?? s.selectedDate ?? defaultDateForMonth(s.project.month),
          selectedEventId: null,
        };
      }),
    closeEditor: () => set({ editorOpen: false }),
    openMaterials: () => set({ materialsOpen: true }),
    closeMaterials: () => set({ materialsOpen: false }),
    openExport: () => set({ exportOpen: true }),
    closeExport: () => set({ exportOpen: false }),

    addEvent: (partial) => {
      const id = `e-${nanoid(8)}`;
      const incomingTitle =
        partial.title === undefined ? "Новое событие" : partial.title;
      const event: EventItem = {
        id,
        title: incomingTitle,
        date: partial.date,
        time: partial.time,
        type: (partial.type as EventType) ?? "other",
        description: partial.description,
        imageDataUrl: partial.imageDataUrl,
        imageUrl: partial.imageUrl,
        imageFit: partial.imageFit ?? (partial.imageDataUrl ? "smart" : undefined),
        imagePosition: partial.imagePosition,
        imageBackgroundMode: partial.imageBackgroundMode,
        imageDominantColor: partial.imageDominantColor,
        imageAspectRatio: partial.imageAspectRatio,
        imageIsMostlyWhite: partial.imageIsMostlyWhite,
        imageLooksLikeScreenshot: partial.imageLooksLikeScreenshot,
        link: partial.link,
        telegramPostUrl: partial.telegramPostUrl,
        telegramMessageId: partial.telegramMessageId,
        telegramChatId: partial.telegramChatId,
        source: partial.source ?? "manual",
        sourceMessageIds: partial.sourceMessageIds,
        tags: partial.tags ?? [],
        isPast: partial.isPast,
        cardStyle: partial.cardStyle ?? "photo",
        relatedMaterialIds: partial.relatedMaterialIds ?? [],
        publishStatus:
          partial.publishStatus ??
          (partial.source === "telegram" ? "draft" : "published"),
        published:
          typeof partial.published === "boolean"
            ? partial.published
            : partial.source === "telegram"
              ? false
              : true,
        visibility: partial.visibility ?? "public",
      };
      set((s) => ({
        project: touch({ ...s.project, events: [...s.project.events, event] }),
        selectedEventId: id,
        selectedDate: event.date,
      }));
      return event;
    },

    updateEvent: (id, patch) =>
      set((s) => ({
        project: touch({
          ...s.project,
          events: s.project.events.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        }),
      })),

    removeEvent: (id) =>
      set((s) => ({
        project: touch({
          ...s.project,
          events: s.project.events.filter((e) => e.id !== id),
        }),
        selectedEventId:
          s.selectedEventId === id ? null : s.selectedEventId,
        editorOpen: s.selectedEventId === id ? false : s.editorOpen,
      })),

    setEventImage: (id, dataUrl) =>
      set((s) => ({
        project: touch({
          ...s.project,
          events: s.project.events.map((e) =>
            e.id === id ? { ...e, imageDataUrl: dataUrl } : e,
          ),
        }),
      })),

    attachImageToDate: async (iso, dataUrl) => {
      if (!isValidImageDataUrl(dataUrl)) {
        get().pushToast("Не удалось прочитать картинку", "error");
        return;
      }
      const meta = await analyzeImageDataUrl(dataUrl);
      const imageMeta = {
        imageDataUrl: dataUrl,
        imageFit: "smart" as const,
        imageBackgroundMode: meta.recommendedBackgroundMode,
        imageDominantColor: meta.dominantColor,
        imageAspectRatio: meta.aspectRatio,
        imageIsMostlyWhite: meta.isMostlyWhite,
        imageLooksLikeScreenshot: meta.looksLikeScreenshot,
      };
      const s = get();
      const eventsOnDate = s.project.events.filter((e) => e.date === iso);
      // Если выбрано конкретное событие на этой дате — обновляем картинку, стиль не трогаем
      if (s.selectedEventId) {
        const sel = s.project.events.find((e) => e.id === s.selectedEventId);
        if (sel && sel.date === iso) {
          get().updateEvent(sel.id, imageMeta);
          get().pushToast("Картинка добавлена в событие", "success");
          return;
        }
      }
      // Если на дате только одно событие — заменяем у него картинку, стиль не трогаем
      if (eventsOnDate.length === 1) {
        get().updateEvent(eventsOnDate[0].id, imageMeta);
        get().pushToast("Картинка добавлена", "success");
        return;
      }
      // Иначе создаём «чистую» картинку: без заголовка/типа/градиента/скруглений
      const created = get().addEvent({
        date: iso,
        title: "",
        type: "other",
        cardStyle: "raw-image",
        ...imageMeta,
      });
      set({ selectedEventId: created.id });
      get().pushToast("Картинка добавлена", "success");
    },

    pasteImage: async (dataUrl) => {
      if (!isValidImageDataUrl(dataUrl)) {
        get().pushToast("Не удалось прочитать картинку", "error");
        return;
      }
      const s = get();
      // Если редактор открыт и есть выбранное событие — заменяем картинку
      if (s.editorOpen && s.selectedEventId) {
        const meta = await analyzeImageDataUrl(dataUrl);
        get().updateEvent(s.selectedEventId, {
          imageDataUrl: dataUrl,
          imageFit: "smart",
          imageBackgroundMode: meta.recommendedBackgroundMode,
          imageDominantColor: meta.dominantColor,
          imageAspectRatio: meta.aspectRatio,
          imageIsMostlyWhite: meta.isMostlyWhite,
          imageLooksLikeScreenshot: meta.looksLikeScreenshot,
        });
        get().pushToast("Картинка добавлена", "success");
        return;
      }
      // Иначе по выбранной дате
      const date =
        s.selectedDate ??
        (s.selectedEventId
          ? s.project.events.find((e) => e.id === s.selectedEventId)?.date
          : null);
      if (date) {
        await get().attachImageToDate(date, dataUrl);
        return;
      }
      // Фоллбэк — на сегодня в текущем месяце
      const fallback = defaultDateForMonth(s.project.month);
      await get().attachImageToDate(fallback, dataUrl);
    },

    addMaterial: (partial) => {
      const now = new Date().toISOString();
      const material: MaterialItem = {
        id: `m-${nanoid(8)}`,
        title: partial?.title?.trim() || "Новая фишка",
        section: partial?.section?.trim() || "Без раздела",
        description: partial?.description,
        url: partial?.url,
        type: partial?.type ?? "other",
        tags: partial?.tags ?? [],
        createdAt: now,
        updatedAt: now,
      };
      set((s) => ({
        project: touch({
          ...s.project,
          materials: [material, ...s.project.materials],
        }),
      }));
      return material;
    },

    updateMaterial: (id, patch) =>
      set((s) => ({
        project: touch({
          ...s.project,
          materials: s.project.materials.map((m) =>
            m.id === id
              ? { ...m, ...patch, updatedAt: new Date().toISOString() }
              : m,
          ),
        }),
      })),

    removeMaterial: (id) =>
      set((s) => ({
        project: touch({
          ...s.project,
          materials: s.project.materials.filter((m) => m.id !== id),
          events: s.project.events.map((e) => ({
            ...e,
            relatedMaterialIds: (e.relatedMaterialIds ?? []).filter(
              (mid) => mid !== id,
            ),
          })),
        }),
      })),

    attachMaterialToEvent: (eventId, materialId) =>
      set((s) => ({
        project: touch({
          ...s.project,
          events: s.project.events.map((e) => {
            if (e.id !== eventId) return e;
            const ids = new Set(e.relatedMaterialIds ?? []);
            ids.add(materialId);
            return { ...e, relatedMaterialIds: Array.from(ids) };
          }),
        }),
      })),

    detachMaterialFromEvent: (eventId, materialId) =>
      set((s) => ({
        project: touch({
          ...s.project,
          events: s.project.events.map((e) =>
            e.id !== eventId
              ? e
              : {
                  ...e,
                  relatedMaterialIds: (e.relatedMaterialIds ?? []).filter(
                    (mid) => mid !== materialId,
                  ),
                },
          ),
        }),
      })),

    dropMaterialOnDate: (iso, materialId) => {
      const s = get();
      const material = s.project.materials.find((m) => m.id === materialId);
      if (!material) return;
      const eventsOnDate = s.project.events.filter((e) => e.date === iso);

      if (eventsOnDate.length === 0) {
        const created = get().addEvent({
          date: iso,
          title: material.title,
          type: "materials",
          cardStyle: "minimal",
          relatedMaterialIds: [materialId],
        });
        set({ selectedEventId: created.id });
        get().pushToast("Событие из фишки создано", "success");
        return;
      }

      if (eventsOnDate.length === 1) {
        get().attachMaterialToEvent(eventsOnDate[0].id, materialId);
        get().pushToast("Фишка прикреплена к событию", "success");
        return;
      }

      if (s.selectedEventId && eventsOnDate.some((e) => e.id === s.selectedEventId)) {
        get().attachMaterialToEvent(s.selectedEventId, materialId);
        get().pushToast("Фишка прикреплена к событию", "success");
        return;
      }

      const created = get().addEvent({
        date: iso,
        title: material.title,
        type: "materials",
        cardStyle: "minimal",
        relatedMaterialIds: [materialId],
      });
      set({ selectedEventId: created.id });
      get().pushToast("Событие из фишки создано", "success");
    },

    dropMaterialOnEvent: (eventId, materialId) => {
      get().attachMaterialToEvent(eventId, materialId);
      get().pushToast("Фишка прикреплена к событию", "success");
    },

    setTheme: (patch) =>
      set((s) => ({
        project: touch({ ...s.project, theme: { ...s.project.theme, ...patch } }),
      })),

    setExportSettings: (patch) =>
      set((s) => ({
        project: touch({
          ...s.project,
          exportSettings: { ...s.project.exportSettings, ...patch },
        }),
      })),

    setHomepageSettings: (patch) =>
      set((s) => ({
        project: touch({
          ...s.project,
          homepageSettings: { ...s.project.homepageSettings, ...patch },
        }),
      })),

    setPublishSettings: (patch) =>
      set((s) => ({
        project: touch({
          ...s.project,
          publishSettings: { ...s.project.publishSettings, ...patch },
        }),
      })),

    setEventPublishStatus: (id, status) =>
      set((s) => ({
        project: touch({
          ...s.project,
          events: s.project.events.map((e) =>
            e.id === id
              ? {
                  ...e,
                  publishStatus: status,
                  published: status === "published",
                }
              : e,
          ),
        }),
      })),

    setEventVisibility: (id, visibility) =>
      set((s) => ({
        project: touch({
          ...s.project,
          events: s.project.events.map((e) =>
            e.id === id ? { ...e, visibility } : e,
          ),
        }),
      })),

    publishEvent: (id) => {
      get().setEventPublishStatus(id, "published");
      get().pushToast("Событие опубликовано на homepage", "success");
    },

    unpublishEvent: (id) => {
      get().setEventPublishStatus(id, "draft");
      get().pushToast("Событие снято с публикации", "info");
    },

    generateAutofillDraft: (monthKey) => {
      const s = get();
      const month = monthKey ?? s.project.month;
      const messages = s.project.rawTelegramMessages ?? [];
      if (messages.length === 0) {
        get().pushToast(
          "Нет данных из Telegram для автосбора. Подключите чат клуба.",
          "info",
        );
        return null;
      }
      const draft = parseTelegramMessages(messages, { monthKey: month });
      set((state) => ({
        project: touch({ ...state.project, autofillDraft: draft }),
      }));
      get().pushToast(
        `Найдено событий-черновиков: ${draft.detectedEvents.length}`,
        "success",
      );
      return draft;
    },

    clearAutofillDraft: () =>
      set((s) => ({
        project: touch({ ...s.project, autofillDraft: null }),
      })),

    approveAutofillEvent: (detectedId, overrides) => {
      const s = get();
      const draft = s.project.autofillDraft;
      if (!draft) return null;
      const detected = draft.detectedEvents.find((d) => d.id === detectedId);
      if (!detected) return null;

      // Создаём событие как draft — публикация всегда подтверждается отдельно.
      const newEvent = get().addEvent({
        date: detected.date,
        time: detected.time,
        type: detected.type,
        title: detected.title,
        description: detected.description,
        telegramPostUrl: detected.telegramPostUrl,
        source: "telegram",
        sourceMessageIds: detected.sourceMessageIds,
        publishStatus: "draft",
        published: false,
        visibility: "members_hint",
        cardStyle: "minimal",
        ...overrides,
      });

      // Помечаем detected как approved.
      set((state) => ({
        project: touch({
          ...state.project,
          autofillDraft: state.project.autofillDraft
            ? {
                ...state.project.autofillDraft,
                detectedEvents: state.project.autofillDraft.detectedEvents.map(
                  (d): AutoDetectedEvent =>
                    d.id === detectedId ? { ...d, status: "approved" } : d,
                ),
              }
            : null,
        }),
      }));

      get().pushToast("Событие добавлено как черновик", "success");
      return newEvent;
    },

    rejectAutofillEvent: (detectedId) =>
      set((state) => ({
        project: touch({
          ...state.project,
          autofillDraft: state.project.autofillDraft
            ? {
                ...state.project.autofillDraft,
                detectedEvents: state.project.autofillDraft.detectedEvents.map(
                  (d): AutoDetectedEvent =>
                    d.id === detectedId ? { ...d, status: "rejected" } : d,
                ),
              }
            : null,
        }),
      })),

    importAllAutofill: (monthKey) => {
      const s = get();
      const draft = s.project.autofillDraft;
      if (!draft) return 0;
      let count = 0;
      draft.detectedEvents
        .filter((d) => d.status === "draft" && d.date.startsWith(monthKey))
        .forEach((d) => {
          get().approveAutofillEvent(d.id);
          count++;
        });
      return count;
    },

    importProject: (incoming) => {
      const safe: CalendarProject = {
        id: incoming.id || `dd-${incoming.month || "unknown"}`,
        title: incoming.title || "Календарь клуба",
        month: incoming.month || get().project.month,
        events: Array.isArray(incoming.events) ? incoming.events : [],
        materials: Array.isArray(incoming.materials) ? incoming.materials : [],
        theme: { ...get().project.theme, ...(incoming.theme ?? {}) },
        exportSettings: {
          ...get().project.exportSettings,
          ...(incoming.exportSettings ?? {}),
        },
        homepageSettings: {
          ...DEFAULT_HOMEPAGE_SETTINGS,
          ...get().project.homepageSettings,
          ...(incoming.homepageSettings ?? {}),
        },
        publishSettings: {
          ...DEFAULT_PUBLISH_SETTINGS,
          ...get().project.publishSettings,
          ...(incoming.publishSettings ?? {}),
        },
        rawTelegramMessages:
          incoming.rawTelegramMessages ?? get().project.rawTelegramMessages,
        autofillDraft: incoming.autofillDraft ?? null,
        updatedAt: new Date().toISOString(),
      };
      set({
        project: safe,
        selectedDate: null,
        selectedEventId: null,
      });
      get().pushToast("Проект импортирован", "success");
    },

    importMaterials: (materials) => {
      const sanitized = materials
        .filter((m) => m && typeof m.id === "string" && typeof m.title === "string")
        .map((m) => ({
          ...m,
          section: m.section || "Без раздела",
          updatedAt: new Date().toISOString(),
        }));
      set((s) => {
        const map = new Map(s.project.materials.map((m) => [m.id, m]));
        sanitized.forEach((m) => map.set(m.id, m));
        return {
          project: touch({ ...s.project, materials: Array.from(map.values()) }),
        };
      });
      get().pushToast(`Импортировано фишек: ${sanitized.length}`, "success");
    },

    resetDemo: () => {
      set({
        project: buildDemoProject(),
        selectedDate: null,
        selectedEventId: null,
        editorOpen: false,
      });
      get().pushToast("Демо восстановлено", "info");
    },

    pushToast: (message, tone = "info") => {
      const id = nanoid(6);
      set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
      const t = window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      }, 3200);
      void t;
    },

    dismissToast: (id) =>
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  })),
);

useCalendarStore.subscribe(
  (state) => state.project,
  (project) => {
    if (useCalendarStore.getState().bootstrapped) {
      saveProject(project);
    }
  },
);

function touch(p: CalendarProject): CalendarProject {
  return { ...p, updatedAt: new Date().toISOString() };
}

function defaultDateForMonth(monthKey: string): string {
  // 1-е число месяца
  return formatISODate(
    new Date(
      Number(monthKey.slice(0, 4)),
      Number(monthKey.slice(5, 7)) - 1,
      1,
    ),
  );
}

function isValidImageDataUrl(s: string | undefined | null): s is string {
  return (
    typeof s === "string" &&
    s.length > 64 &&
    s.startsWith("data:image/") &&
    s !== "data:,"
  );
}

export function useEmptyMonth(monthKey: string): CalendarProject {
  return buildEmptyProject(monthKey);
}
