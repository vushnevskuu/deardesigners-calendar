import { useEffect, useMemo, useRef, useState } from "react";
import { useCalendarStore } from "../state/calendarStore";
import { type EventItem } from "../lib/types";
import { Drawer } from "./Drawer";
import { analyzeImageDataUrl, fileToDataUrl } from "../lib/image";
import { filterMaterials, materialsForEvent, uniqueSections } from "../lib/materials";
import { SmartImage } from "./SmartImage";

const EMPTY_EVENT: Partial<EventItem> = {
  title: "",
  type: "other",
  cardStyle: "photo",
  description: "",
  time: "",
  link: "",
  tags: [],
  relatedMaterialIds: [],
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
  const attachMaterialToEvent = useCalendarStore((s) => s.attachMaterialToEvent);
  const detachMaterialFromEvent = useCalendarStore((s) => s.detachMaterialFromEvent);
  const pushToast = useCalendarStore((s) => s.pushToast);

  const editing = useMemo(
    () =>
      mode === "edit" && selectedEventId
        ? project.events.find((e) => e.id === selectedEventId) ?? null
        : null,
    [mode, selectedEventId, project.events],
  );

  const [draft, setDraft] = useState<Partial<EventItem>>(EMPTY_EVENT);
  const [materialQuery, setMaterialQuery] = useState("");
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
    setMaterialQuery("");
  }, [open, editing, selectedDate, project.month]);

  const onSave = () => {
    const date = (draft.date as string) || defaultDateForMonth(project.month);
    const trimmedTitle = (draft.title ?? "").trim();
    const trimmedDescription = draft.description?.trim() ?? "";
    const linkedCount = (draft.relatedMaterialIds ?? []).length;
    const hasContent =
      trimmedTitle.length > 0 ||
      trimmedDescription.length > 0 ||
      linkedCount > 0;
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
        link: draft.link?.trim() || undefined,
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
        publishStatus: draft.publishStatus ?? editing.publishStatus,
        published:
          typeof draft.published === "boolean"
            ? draft.published
            : (draft.publishStatus ?? editing.publishStatus) === "published",
        visibility: draft.visibility ?? editing.visibility,
      });
      pushToast("Событие сохранено", "success");
    } else {
      addEvent({
        title: trimmedTitle,
        date,
        time: draft.time?.trim() || undefined,
        type: "other",
        description: trimmedDescription || undefined,
        link: draft.link?.trim() || undefined,
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
        publishStatus: draft.publishStatus,
        published: draft.published,
        visibility: draft.visibility,
        relatedMaterialIds: draft.relatedMaterialIds ?? [],
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

  const linkedIds = new Set(draft.relatedMaterialIds ?? []);
  const sections = useMemo(() => uniqueSections(project.materials), [project.materials]);
  const filteredMaterials = useMemo(
    () =>
      filterMaterials(project.materials, {
        query: materialQuery,
        section: "all",
        type: "all",
      }),
    [project.materials, materialQuery],
  );

  const linkedMaterials = useMemo(() => {
    if (mode === "edit" && editing) {
      return materialsForEvent(editing, project.materials);
    }
    const map = new Map(project.materials.map((m) => [m.id, m]));
    return (draft.relatedMaterialIds ?? [])
      .map((id) => map.get(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));
  }, [mode, editing, project.materials, draft.relatedMaterialIds]);

  const toggleMaterial = (id: string) => {
    if (mode === "edit" && editing) {
      if (linkedIds.has(id)) {
        detachMaterialFromEvent(editing.id, id);
      } else {
        attachMaterialToEvent(editing.id, id);
      }
      // sync local linked list
      setDraft((d) => {
        const cur = new Set(d.relatedMaterialIds ?? []);
        if (cur.has(id)) cur.delete(id);
        else cur.add(id);
        return { ...d, relatedMaterialIds: Array.from(cur) };
      });
    } else {
      setDraft((d) => {
        const cur = new Set(d.relatedMaterialIds ?? []);
        if (cur.has(id)) cur.delete(id);
        else cur.add(id);
        return { ...d, relatedMaterialIds: Array.from(cur) };
      });
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

        <Field label="Ссылка">
          <input
            className="dd-input"
            value={draft.link ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))}
            placeholder="https://"
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

        <Field label="Прикреплённые фишки">
          <div className="flex flex-col gap-3">
            {linkedMaterials.length === 0 ? (
              <div className="text-[12px]" style={{ color: "var(--dd-muted)" }}>
                Пока ничего не прикреплено. Найди фишку ниже или перетащи её на карточку.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {linkedMaterials.map((m) => (
                  <span key={m.id} className="dd-chip-soft">
                    <span aria-hidden>✦</span>
                    <span className="max-w-[220px] truncate">{m.title}</span>
                    <button
                      type="button"
                      onClick={() => toggleMaterial(m.id)}
                      className="ml-1 text-xs"
                      aria-label={`Открепить ${m.title}`}
                      style={{ color: "var(--dd-muted)" }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              className="dd-input"
              placeholder="Поиск по фишкам..."
              value={materialQuery}
              onChange={(e) => setMaterialQuery(e.target.value)}
            />
            <div
              className="dd-scroll max-h-60 overflow-y-auto rounded-2xl"
              style={{ background: "var(--dd-surface-soft)" }}
            >
              {filteredMaterials.length === 0 ? (
                <div className="px-4 py-3 text-[12px]" style={{ color: "var(--dd-muted)" }}>
                  Ничего не нашли.
                </div>
              ) : (
                <ul>
                  {filteredMaterials.map((m) => {
                    const checked = linkedIds.has(m.id);
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => toggleMaterial(m.id)}
                          className="flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left hover:bg-[color:var(--dd-surface-soft)]"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-[14px] font-medium">{m.title}</div>
                            <div className="truncate text-[11px]" style={{ color: "var(--dd-muted)" }}>
                              {m.section}
                            </div>
                          </div>
                          <span
                            className="mt-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                            style={{
                              background: checked
                                ? "var(--dd-ink)"
                                : "rgba(0,0,0,0.08)",
                              color: checked ? "#fff" : "var(--dd-muted)",
                            }}
                            aria-hidden
                          >
                            {checked ? "✓" : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {sections.length > 0 && (
              <div className="text-[11px]" style={{ color: "var(--dd-muted)" }}>
                Разделов в библиотеке: {sections.length}
              </div>
            )}
          </div>
        </Field>

        <Field label="Публикация на homepage">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <PublishOption
                active={(draft.publishStatus ?? "published") === "draft"}
                title="Черновик"
                hint="Виден только в admin"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    publishStatus: "draft",
                    published: false,
                  }))
                }
              />
              <PublishOption
                active={(draft.publishStatus ?? "published") === "review"}
                title="На проверке"
                hint="Команда смотрит, не публикуется"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    publishStatus: "review",
                    published: false,
                  }))
                }
              />
              <PublishOption
                active={(draft.publishStatus ?? "published") === "published"}
                title="Опубликовано"
                hint="Видно посетителям сайта"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    publishStatus: "published",
                    published: true,
                  }))
                }
              />
              <PublishOption
                active={draft.publishStatus === "hidden"}
                title="Скрыто"
                hint="Снято с публикации"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    publishStatus: "hidden",
                    published: false,
                  }))
                }
              />
            </div>
            <span className="dd-label">Видимость</span>
            <div className="flex flex-wrap gap-2">
              <PublishOption
                active={(draft.visibility ?? "public") === "public"}
                title="Публично"
                hint="Полная карточка"
                onClick={() =>
                  setDraft((d) => ({ ...d, visibility: "public" }))
                }
              />
              <PublishOption
                active={draft.visibility === "members_hint"}
                title="Только намёк"
                hint="Дата, тип и кнопка Telegram"
                onClick={() =>
                  setDraft((d) => ({ ...d, visibility: "members_hint" }))
                }
              />
              <PublishOption
                active={draft.visibility === "private"}
                title="Приватно"
                hint="Только в admin"
                onClick={() =>
                  setDraft((d) => ({ ...d, visibility: "private" }))
                }
              />
            </div>
            {draft.source === "telegram" && (
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
            )}
          </div>
        </Field>

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

function PublishOption({
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
      aria-pressed={active}
      className="flex flex-col gap-0.5 rounded-2xl px-3 py-2 text-left text-[12px] transition-colors"
      style={{
        background: active ? "var(--dd-ink)" : "var(--dd-surface-soft)",
        color: active ? "#ffffff" : "var(--dd-ink)",
        minWidth: 130,
      }}
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
