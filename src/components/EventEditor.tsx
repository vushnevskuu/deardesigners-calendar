import { useEffect, useMemo, useRef, useState } from "react";
import { useCalendarStore } from "../state/calendarStore";
import { type EventItem } from "../lib/types";
import { Drawer } from "./Drawer";
import { analyzeImageDataUrl, fileToDataUrl } from "../lib/image";
import { SmartImage } from "./SmartImage";

const EMPTY_EVENT: Partial<EventItem> = {
  title: "",
  type: "other",
  cardStyle: "photo",
  description: "",
  time: "",
  link: "",
  tags: [],
};

export function EventEditor() {
  const open = useCalendarStore((s) => s.editorOpen);
  const mode = useCalendarStore((s) => s.editorMode);
  const close = useCalendarStore((s) => s.closeEditor);
  const project = useCalendarStore((s) => s.project);
  const selectedEventId = useCalendarStore((s) => s.selectedEventId);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const removeEvent = useCalendarStore((s) => s.removeEvent);
  const pushToast = useCalendarStore((s) => s.pushToast);

  const editing = useMemo(
    () =>
      mode === "edit" && selectedEventId
        ? project.events.find((e) => e.id === selectedEventId) ?? null
        : null,
    [mode, selectedEventId, project.events],
  );

  const [draft, setDraft] = useState<Partial<EventItem>>(EMPTY_EVENT);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDraft({ ...editing });
    } else {
      setDraft({
        ...EMPTY_EVENT,
        date: selectedDate ?? defaultDateForMonth(project.month),
      });
    }
  }, [open, editing, selectedDate, project.month]);

  const onSave = () => {
    const date = (draft.date as string) || defaultDateForMonth(project.month);
    const trimmedTitle = (draft.title ?? "").trim();
    const trimmedDescription = draft.description?.trim() ?? "";
    const hasContent =
      trimmedTitle.length > 0 || trimmedDescription.length > 0;
    const computedStyle = draft.imageDataUrl
      ? hasContent
        ? "photo"
        : "raw-image"
      : "text-only";

    if (mode === "edit" && editing) {
      updateEvent(editing.id, {
        title: trimmedTitle || "",
        date,
        time: draft.time?.trim() || undefined,
        description: trimmedDescription || undefined,
        cardStyle: computedStyle,
        imageDataUrl: draft.imageDataUrl,
        imageFit: draft.imageFit ?? "smart",
        imagePosition: draft.imagePosition,
        imageBackgroundMode: draft.imageBackgroundMode,
        imageDominantColor: draft.imageDominantColor,
        imageAspectRatio: draft.imageAspectRatio,
        imageIsMostlyWhite: draft.imageIsMostlyWhite,
        imageLooksLikeScreenshot: draft.imageLooksLikeScreenshot,
        telegramPostUrl: draft.telegramPostUrl?.trim() || undefined,
        publishStatus: editing.publishStatus ?? "published",
        published:
          typeof editing.published === "boolean" ? editing.published : true,
        visibility: editing.visibility ?? "public",
      });
      pushToast("Событие сохранено", "success");
    } else {
      addEvent({
        title: trimmedTitle,
        date,
        time: draft.time?.trim() || undefined,
        type: "other",
        description: trimmedDescription || undefined,
        cardStyle: computedStyle,
        imageDataUrl: draft.imageDataUrl,
        imageFit: draft.imageFit ?? "smart",
        imagePosition: draft.imagePosition,
        imageBackgroundMode: draft.imageBackgroundMode,
        imageDominantColor: draft.imageDominantColor,
        imageAspectRatio: draft.imageAspectRatio,
        imageIsMostlyWhite: draft.imageIsMostlyWhite,
        imageLooksLikeScreenshot: draft.imageLooksLikeScreenshot,
        telegramPostUrl: draft.telegramPostUrl?.trim() || undefined,
        publishStatus: "published",
        published: true,
        visibility: "public",
      });
      pushToast("Событие создано", "success");
    }
    close();
  };

  const onDelete = () => {
    if (!editing) return;
    if (confirm(`Удалить событие «${editing.title}»?`)) {
      removeEvent(editing.id);
      pushToast("Событие удалено", "info");
    }
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const meta = await analyzeImageDataUrl(dataUrl);
      setDraft((d) => ({
        ...d,
        imageDataUrl: dataUrl,
        cardStyle: "photo",
        imageFit: "smart",
        imageBackgroundMode: meta.recommendedBackgroundMode,
        imageDominantColor: meta.dominantColor,
        imageAspectRatio: meta.aspectRatio,
        imageIsMostlyWhite: meta.isMostlyWhite,
        imageLooksLikeScreenshot: meta.looksLikeScreenshot,
      }));
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Не удалось", "error");
    }
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      side="right"
      width={520}
      title={mode === "edit" ? "Редактировать событие" : "Новое событие"}
      ariaLabel="Редактор события"
    >
      <div className="flex flex-col gap-5 px-5 py-5">
        <Field label="Название">
          <input
            className="dd-input"
            value={draft.title ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Например: Лекция по референсам"
            autoFocus
          />
        </Field>

        <Field label="Описание">
          <textarea
            className="dd-input-area"
            value={draft.description ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Что случится. Можно тон-оф-войсом клуба."
          />
        </Field>

        <Field label="Telegram-пост">
          <input
            className="dd-input"
            value={draft.telegramPostUrl ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, telegramPostUrl: e.target.value }))
            }
            placeholder="https://t.me/c/.../1234"
          />
          <span className="text-[11px]" style={{ color: "var(--dd-muted)" }}>
            Если есть — на homepage появится кнопка «Пост в Telegram» с
            пометкой «Доступно участникам клуба».
          </span>
        </Field>

        <Field label="Картинка">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="dd-btn" onClick={() => fileInputRef.current?.click()}>
              {draft.imageDataUrl ? "Заменить картинку" : "Загрузить картинку"}
            </button>
            {draft.imageDataUrl && (
              <button
                type="button"
                className="dd-btn dd-btn-ghost"
                onClick={() => setDraft((d) => ({ ...d, imageDataUrl: undefined }))}
              >
                Очистить
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPickImage}
            />
            <span className="text-[12px]" style={{ color: "var(--dd-muted)" }}>
              Или Ctrl/Cmd+V на ячейке.
            </span>
          </div>
          {draft.imageDataUrl && (
            <div
              className="mt-3 h-40 w-full overflow-hidden rounded-2xl"
              style={{ background: "#111111" }}
              aria-hidden
            >
              <SmartImage
                src={draft.imageDataUrl}
                fit={draft.imageFit ?? "smart"}
                backgroundMode={draft.imageBackgroundMode}
                dominantColor={draft.imageDominantColor}
                objectPosition={draft.imagePosition ?? "center center"}
              />
            </div>
          )}
          {draft.imageDataUrl && (
            <div className="mt-3 flex flex-col gap-2">
              <span className="dd-label">Обрезка изображения</span>
              <div className="flex flex-wrap gap-2">
                <FitOption
                  active={(draft.imageFit ?? "smart") === "smart"}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      imageFit: "smart",
                      imageBackgroundMode:
                        d.imageBackgroundMode ?? "blurred-fill",
                    }))
                  }
                  title="Авто"
                  hint="Подбирает оптимальный режим"
                />
                <FitOption
                  active={draft.imageFit === "contain"}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      imageFit: "contain",
                      imageBackgroundMode:
                        d.imageBackgroundMode ?? "blurred-fill",
                    }))
                  }
                  title="Полностью видно"
                  hint="Картинка целиком, фон — её же блюр"
                />
                <FitOption
                  active={draft.imageFit === "cover"}
                  onClick={() =>
                    setDraft((d) => ({ ...d, imageFit: "cover" }))
                  }
                  title="Заполнить карточку"
                  hint="Обрезает по краям"
                />
              </div>
              {draft.imageAspectRatio && (
                <span
                  className="text-[11px]"
                  style={{ color: "var(--dd-muted)" }}
                >
                  Соотношение сторон: {draft.imageAspectRatio.toFixed(2)} ·
                  доминантный цвет:{" "}
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      verticalAlign: "middle",
                      background: draft.imageDominantColor ?? "#111",
                      marginLeft: 4,
                    }}
                  />
                </span>
              )}
            </div>
          )}
          {draft.imageDataUrl && (
            <div className="mt-3 flex flex-col gap-2">
              <span className="dd-label">Фон изображения</span>
              <div className="flex flex-wrap gap-2">
                <FitOption
                  active={false}
                  onClick={() =>
                    setDraft((d) => {
                      const auto =
                        d.imageIsMostlyWhite || d.imageLooksLikeScreenshot
                          ? "solid"
                          : "blurred-fill";
                      return { ...d, imageBackgroundMode: auto };
                    })
                  }
                  title="Авто"
                  hint="Подбирает фон по картинке"
                />
                <FitOption
                  active={draft.imageBackgroundMode === "blurred-fill"}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      imageBackgroundMode: "blurred-fill",
                    }))
                  }
                  title="Размытый фон"
                  hint="Та же картинка как блюр"
                />
                <FitOption
                  active={draft.imageBackgroundMode === "dominant-color"}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      imageBackgroundMode: "dominant-color",
                    }))
                  }
                  title="Цвет из картинки"
                  hint="Однотонный доминантный фон"
                />
                <FitOption
                  active={draft.imageBackgroundMode === "solid"}
                  onClick={() =>
                    setDraft((d) => {
                      // Если доминант слишком тёмный или грязный — уйти в белый.
                      const dom = d.imageDominantColor ?? "#ffffff";
                      const lum = quickLuminance(dom);
                      const safe =
                        d.imageIsMostlyWhite || lum < 0.7
                          ? "#ffffff"
                          : dom;
                      return {
                        ...d,
                        imageBackgroundMode: "solid",
                        imageDominantColor: safe,
                      };
                    })
                  }
                  title="Чистый фон"
                  hint="Без блюра, для белых скриншотов"
                />
              </div>
            </div>
          )}
        </Field>

        {draft.source === "telegram" && (
          <Field label="Источник">
            <div
              className="rounded-2xl px-3 py-2 text-[12px]"
              style={{
                background: "var(--dd-surface-soft)",
                color: "var(--dd-ink-soft)",
              }}
            >
              Событие пришло из Telegram. Проверьте текст и обложку перед
              публикацией.
            </div>
          </Field>
        )}

      </div>

      <footer
        className="sticky bottom-0 flex items-center justify-between gap-2 px-5 py-4"
        style={{ background: "var(--dd-surface)" }}
      >
        {mode === "edit" && editing ? (
          <button
            type="button"
            className="dd-btn dd-btn-ghost dd-btn-sm"
            onClick={onDelete}
          >
            Удалить
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button type="button" className="dd-btn dd-btn-sm" onClick={close}>
            Отмена
          </button>
          <button type="button" className="dd-btn dd-btn-primary dd-btn-sm" onClick={onSave}>
            Сохранить
          </button>
        </div>
      </footer>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="dd-label">{label}</span>
      {children}
    </div>
  );
}

function FitOption({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-1 rounded-2xl px-3 py-2 text-left text-[12px] transition-colors"
      style={{
        background: active ? "var(--dd-ink)" : "var(--dd-surface-soft)",
        color: active ? "#ffffff" : "var(--dd-ink)",
        minWidth: 140,
      }}
      aria-pressed={active}
    >
      <span style={{ fontWeight: 500 }}>{title}</span>
      <span
        style={{
          color: active ? "rgba(255,255,255,0.72)" : "var(--dd-muted)",
          fontSize: 11,
          lineHeight: 1.3,
        }}
      >
        {hint}
      </span>
    </button>
  );
}

function quickLuminance(hex: string): number {
  const m = /^#?([a-fA-F0-9]{6})$/.exec(hex.trim());
  if (!m) return 0;
  const v = parseInt(m[1], 16);
  const r = ((v >> 16) & 255) / 255;
  const g = ((v >> 8) & 255) / 255;
  const b = (v & 255) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function defaultDateForMonth(monthKey: string): string {
  return `${monthKey}-01`;
}
