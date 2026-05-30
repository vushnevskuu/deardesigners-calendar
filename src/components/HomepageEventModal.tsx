import { useEffect } from "react";
import { formatHumanDate } from "../lib/calendar";
import type { CalendarProject, EventItem } from "../lib/types";
import { CloseIcon } from "./icons";
import { SmartImage } from "./SmartImage";

type Props = {
  event: EventItem | null;
  project: CalendarProject;
  onClose: () => void;
};

// Публичная модалка события на homepage. Только чтение, без редактирования.
// Учитывает visibility: для members_hint скрывает приватные тексты.
export function HomepageEventModal({ event, project, onClose }: Props) {
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [event, onClose]);

  if (!event) return null;

  const isHinted = event.visibility === "members_hint";
  const showTelegram = project.publishSettings?.showTelegramLinks ?? true;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={event.title || "Событие"}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(20,18,16,0.42)" }}
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[88vh] w-[min(96vw,720px)] flex-col overflow-hidden rounded-3xl"
        style={{
          background: "var(--dd-surface)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
        }}
      >
        {event.imageDataUrl && (
          <div
            className="relative w-full"
            style={{ aspectRatio: "16 / 9", background: "#000" }}
          >
            <SmartImage
              src={event.imageDataUrl}
              alt={event.title}
              fit={event.imageFit ?? "smart"}
              backgroundMode={event.imageBackgroundMode}
              dominantColor={event.imageDominantColor}
              objectPosition={event.imagePosition ?? "center center"}
            />
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="dd-icon-btn dd-icon-btn-sm absolute right-3 top-3"
          style={{ background: "rgba(255,255,255,0.92)", color: "#000" }}
        >
          <CloseIcon />
        </button>
        <div className="dd-scroll flex-1 overflow-y-auto p-6 md:p-8">
          <div
            className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em]"
            style={{ color: "var(--dd-ink-soft)" }}
          >
            <span>{formatHumanDate(event.date)}</span>
            {event.time && <span>· {event.time}</span>}
          </div>
          <h2
            className="mt-3 font-display text-display-md"
            style={{ color: "var(--dd-ink)" }}
          >
            {event.title || "Событие клуба"}
          </h2>
          {!isHinted && event.description && (
            <p
              className="mt-3 text-base"
              style={{ color: "var(--dd-ink-soft)", lineHeight: 1.6 }}
            >
              {event.description}
            </p>
          )}
          {isHinted && (
            <p
              className="mt-3 rounded-2xl px-4 py-3 text-sm"
              style={{
                background: "var(--dd-surface-soft)",
                color: "var(--dd-ink-soft)",
              }}
            >
              Подробности доступны участникам клуба. Откройте пост в Telegram,
              чтобы прочитать обсуждение и присоединиться.
            </p>
          )}

          {showTelegram && event.telegramPostUrl && (
            <a
              href={event.telegramPostUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium"
              style={{
                background: "var(--dd-ink)",
                color: "#ffffff",
                textDecoration: "none",
              }}
            >
              <span>Пост в Telegram</span>
              <span aria-hidden>↗</span>
            </a>
          )}
          {showTelegram && event.telegramPostUrl && (
            <div
              className="mt-2 text-xs"
              style={{ color: "var(--dd-ink-soft)" }}
            >
              Доступно участникам клуба
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
