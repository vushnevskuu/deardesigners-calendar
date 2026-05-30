import { useState, useCallback } from "react";
import type { GridCell } from "../lib/calendar";
import type { EventItem } from "../lib/types";
import { EventCard } from "./EventCard";
import { SmartImage } from "./SmartImage";
import { useCalendarStore } from "../state/calendarStore";
import { filesFromDropToDataUrl } from "../lib/image";
import { PlusIcon } from "./icons";

function luminance(hex: string | undefined): number {
  if (!hex) return 0;
  const m = /^#?([a-fA-F0-9]{6})$/.exec(hex.trim());
  if (!m) return 0;
  const v = parseInt(m[1], 16);
  const r = ((v >> 16) & 255) / 255;
  const g = ((v >> 8) & 255) / 255;
  const b = (v & 255) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

type Props = {
  cell: GridCell;
  events: EventItem[];
};

export function CalendarCell({ cell, events }: Props) {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const selectedEventId = useCalendarStore((s) => s.selectedEventId);
  const selectDate = useCalendarStore((s) => s.selectDate);
  const openEditor = useCalendarStore((s) => s.openEditor);
  const attachImageToDate = useCalendarStore((s) => s.attachImageToDate);
  const pushToast = useCalendarStore((s) => s.pushToast);

  const [dragOver, setDragOver] = useState(false);
  const isSelected = selectedDate === cell.iso;
  const visible = events.slice(0, 3);
  const overflow = events.length - visible.length;

  // Полноразмерная картинка — ровно одно событие raw-image c валидной картинкой
  // и без текстового контента (заголовок/описание → обычная карточка).
  const candidate = events.length === 1 ? events[0] : null;
  const candidateUntitled = candidate
    ? !candidate.title?.trim() ||
      candidate.title.trim().toLowerCase() === "без названия"
    : true;
  const candidateNoText =
    candidate && candidateUntitled && !candidate.description?.trim();
  const fullRawEvent =
    candidate &&
    candidate.cardStyle === "raw-image" &&
    Boolean(candidate.imageDataUrl) &&
    candidateNoText
      ? candidate
      : null;

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!cell.inMonth) return;
      if (!e.dataTransfer.types.includes("Files")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOver(true);
    },
    [cell.inMonth],
  );

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (!cell.inMonth) return;
      const files = e.dataTransfer.files;
      if (files && files.length) {
        try {
          const dataUrl = await filesFromDropToDataUrl(files);
          if (dataUrl) {
            attachImageToDate(cell.iso, dataUrl);
          } else {
            pushToast("Это не картинка", "error");
          }
        } catch (err) {
          pushToast(err instanceof Error ? err.message : "Не удалось", "error");
        }
      }
    },
    [cell.inMonth, cell.iso, attachImageToDate, pushToast],
  );

  const onCellClick = () => {
    if (!cell.inMonth) return;
    selectDate(cell.iso);
  };

  const onCellDoubleClick = () => {
    if (!cell.inMonth) return;
    openEditor("create", { date: cell.iso });
  };

  if (!cell.inMonth) {
    return (
      <div
        className="rounded-dd-card"
        style={{ background: "transparent", aspectRatio: "1 / 1" }}
        aria-hidden
      />
    );
  }

  if (fullRawEvent) {
    const bgMode = fullRawEvent.imageBackgroundMode ?? "blurred-fill";
    const isSolid = bgMode === "solid";
    const isLightBg =
      fullRawEvent.imageIsMostlyWhite ||
      fullRawEvent.imageLooksLikeScreenshot ||
      isSolid ||
      luminance(fullRawEvent.imageDominantColor) > 0.7;
    const dayColor = isLightBg ? "#000000" : "#ffffff";
    const dayShadow = isLightBg ? "none" : "0 1px 6px rgba(0,0,0,0.45)";
    return (
      <div
        role="gridcell"
        aria-selected={isSelected}
        aria-label={`Дата ${cell.day}, картинка`}
        data-has-image="true"
        data-image-bg-mode={bgMode}
        onClick={() => {
          selectDate(cell.iso);
          openEditor("edit", { eventId: fullRawEvent.id });
        }}
        onDragEnter={onDragOver}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "group relative flex cursor-pointer overflow-hidden rounded-dd-card transition-all",
          dragOver ? "scale-[1.01]" : "",
        ].join(" ")}
        style={{
          aspectRatio: "1 / 1",
          backgroundColor: fullRawEvent.imageDominantColor ?? "var(--dd-surface)",
          boxShadow: isSelected ? "0 6px 22px rgba(0,0,0,0.18)" : "none",
        }}
      >
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <SmartImage
            src={fullRawEvent.imageDataUrl as string}
            alt={fullRawEvent.title}
            fit={fullRawEvent.imageFit ?? "smart"}
            backgroundMode={fullRawEvent.imageBackgroundMode}
            dominantColor={fullRawEvent.imageDominantColor}
            objectPosition={fullRawEvent.imagePosition ?? "center center"}
          />
        </div>
        {!isLightBg && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-12"
            aria-hidden
            style={{
              zIndex: 1,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)",
            }}
          />
        )}
        <div
          className="absolute inset-x-0 top-0 flex items-start justify-between p-3"
          style={{ zIndex: 2 }}
        >
          <span
            className="text-[22px] font-medium leading-none"
            style={{
              color: dayColor,
              letterSpacing: "-0.02em",
              textShadow: dayShadow,
            }}
          >
            {cell.day}
          </span>
          {cell.isToday && (
            <span
              className="rounded-full px-2 py-[3px] text-[9px] uppercase tracking-[0.16em] font-medium"
              style={{
                background: isLightBg ? "var(--dd-ink)" : "#ffffff",
                color: isLightBg ? "#ffffff" : "#000000",
              }}
            >
              сегодня
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label={`Добавить событие на ${cell.day}`}
          className="absolute bottom-2 right-2 opacity-0 transition group-hover:opacity-100"
          style={{
            zIndex: 2,
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            color: "#000000",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => {
            e.stopPropagation();
            openEditor("create", { date: cell.iso });
          }}
        >
          <PlusIcon size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      aria-label={`Дата ${cell.day}, событий: ${events.length}`}
      onClick={onCellClick}
      onDoubleClick={onCellDoubleClick}
      onDragEnter={onDragOver}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={[
        "group relative rounded-dd-card transition-all",
        dragOver ? "scale-[1.01]" : "",
      ].join(" ")}
      style={{
        aspectRatio: "1 / 1",
        overflow: "hidden",
        background: dragOver ? "#ececec" : "var(--dd-surface)",
        boxShadow: isSelected ? "0 0 0 2px var(--dd-ink)" : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 12,
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div className="flex items-center justify-between" style={{ flex: "0 0 auto" }}>
          <div className="flex items-baseline gap-2 leading-none">
            <span
              className="text-[22px] font-medium"
              style={{
                color: "var(--dd-ink)",
                letterSpacing: "-0.02em",
              }}
            >
              {cell.day}
            </span>
            {cell.isToday && (
              <span
                className="rounded-full px-2 py-[3px] text-[9px] uppercase tracking-[0.16em] font-medium"
                style={{ background: "var(--dd-ink)", color: "#ffffff" }}
              >
                сегодня
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label={`Добавить событие на ${cell.day}`}
            className="dd-icon-btn opacity-0 transition group-hover:opacity-100"
            style={{ width: 28, height: 28, flex: "0 0 auto" }}
            onClick={(e) => {
              e.stopPropagation();
              openEditor("create", { date: cell.iso });
            }}
          >
            <PlusIcon size={12} />
          </button>
        </div>

        {events.length === 0 ? (
          <div
            className="flex items-center justify-center text-center text-[11px] leading-tight"
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              color: "var(--dd-muted)",
              background: "transparent",
              padding: "10px 8px",
              overflow: "hidden",
            }}
          >
            {dragOver ? "Отпусти, чтобы добавить" : "Перетащи картинку или добавь событие"}
          </div>
        ) : (
          <div
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              overflow: "hidden",
            }}
          >
            {visible.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                selected={selectedEventId === ev.id}
                onClick={(e) => {
                  e.stopPropagation();
                  selectDate(cell.iso);
                  openEditor("edit", { eventId: ev.id });
                }}
              />
            ))}
            {overflow > 0 && (
              <button
                type="button"
                className="rounded-full px-3 py-1 text-[11px]"
                style={{
                  flex: "0 0 auto",
                  alignSelf: "flex-start",
                  background: "var(--dd-surface-soft)",
                  color: "var(--dd-ink)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectDate(cell.iso);
                  openEditor("edit", { eventId: events[3].id });
                }}
              >
                +{overflow} ещё
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
