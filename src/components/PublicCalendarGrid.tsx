import { useMemo, useState } from "react";
import { buildMonthGrid, WEEKDAYS_RU_SHORT } from "../lib/calendar";
import { isEventPublic } from "../lib/publicApi";
import type { CalendarProject, EventItem } from "../lib/types";
import { EventCard } from "./EventCard";
import { SmartImage } from "./SmartImage";
import { HomepageEventModal } from "./HomepageEventModal";

type Props = {
  project: CalendarProject;
  monthKey: string;
  compact?: boolean;
  // Если включено — кликаемые события открывают публичную модалку.
  enableModal?: boolean;
  showTelegramLinks?: boolean;
};

// Публичная сетка календаря: те же данные, но без drag&drop, plus-кнопок и редактора.
// Используется и на homepage, и в embed-виджете.
export function PublicCalendarGrid({
  project,
  monthKey,
  compact,
  enableModal = true,
  showTelegramLinks = true,
}: Props) {
  const cells = useMemo(() => buildMonthGrid(monthKey), [monthKey]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    project.events
      .filter((e) => isEventPublic(e, project))
      .forEach((e) => {
        const arr = map.get(e.date) ?? [];
        arr.push(e);
        map.set(e.date, arr);
      });
    map.forEach((arr) =>
      arr.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")),
    );
    return map;
  }, [project, monthKey]);

  const [openEvent, setOpenEvent] = useState<EventItem | null>(null);

  return (
    <div>
      <div
        className={[
          "grid grid-cols-7 px-1 pb-3 text-[11px] font-normal uppercase tracking-[0.16em]",
          compact ? "gap-1.5" : "gap-2 md:gap-3",
        ].join(" ")}
        style={{ color: "var(--dd-muted)" }}
        role="row"
      >
        {WEEKDAYS_RU_SHORT.map((d) => (
          <div key={d} className="px-3" role="columnheader">
            {d}
          </div>
        ))}
      </div>

      <div
        role="grid"
        aria-label="Публичный календарь месяца"
        className={[
          "grid grid-cols-7 items-start",
          compact ? "gap-1.5" : "gap-2 md:gap-3",
        ].join(" ")}
      >
        {cells.map((c) => {
          const events = eventsByDate.get(c.iso) ?? [];
          if (!c.inMonth) {
            return (
              <div
                key={c.iso}
                aria-hidden
                className="rounded-dd-card"
                style={{ background: "transparent", aspectRatio: "1 / 1" }}
              />
            );
          }

          // Полноразмерная картинка (raw-image без текста) — рендерим как
          // в admin-режиме, чтобы публичный лендинг выглядел эффектно.
          const candidate = events.length === 1 ? events[0] : null;
          const isUntitled = candidate
            ? !candidate.title?.trim() ||
              candidate.title.trim().toLowerCase() === "без названия"
            : true;
          const fullRaw =
            candidate &&
            candidate.cardStyle === "raw-image" &&
            Boolean(candidate.imageDataUrl) &&
            isUntitled &&
            !candidate.description?.trim()
              ? candidate
              : null;

          if (fullRaw) {
            return (
              <button
                key={c.iso}
                type="button"
                onClick={() =>
                  enableModal ? setOpenEvent(fullRaw) : undefined
                }
                className="relative overflow-hidden rounded-dd-card"
                style={{
                  aspectRatio: "1 / 1",
                  cursor: enableModal ? "pointer" : "default",
                  background: fullRaw.imageDominantColor ?? "#000000",
                }}
                aria-label={fullRaw.title || "Событие"}
              >
                <div className="absolute inset-0">
                  <SmartImage
                    src={fullRaw.imageDataUrl as string}
                    alt={fullRaw.title}
                    fit={fullRaw.imageFit ?? "smart"}
                    backgroundMode={fullRaw.imageBackgroundMode}
                    dominantColor={fullRaw.imageDominantColor}
                    objectPosition={fullRaw.imagePosition ?? "center center"}
                  />
                </div>
                <span
                  className="absolute left-3 top-3 text-[20px] font-medium leading-none"
                  style={{
                    color: "#ffffff",
                    textShadow: "0 1px 6px rgba(0,0,0,0.45)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {c.day}
                </span>
              </button>
            );
          }

          const visible = events.slice(0, compact ? 1 : 2);
          const overflow = events.length - visible.length;

          return (
            <div
              key={c.iso}
              role="gridcell"
              className="relative rounded-dd-card"
              style={{
                aspectRatio: "1 / 1",
                overflow: "hidden",
                background: "var(--dd-surface)",
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
                <div
                  className="flex items-baseline justify-between"
                  style={{ flex: "0 0 auto" }}
                >
                  <span
                    className="text-[22px] font-medium leading-none"
                    style={{
                      color: "var(--dd-ink)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {c.day}
                  </span>
                  {c.isToday && (
                    <span
                      className="rounded-full px-2 py-[3px] text-[9px] uppercase tracking-[0.16em] font-medium"
                      style={{ background: "var(--dd-ink)", color: "#ffffff" }}
                    >
                      сегодня
                    </span>
                  )}
                </div>
                {events.length === 0 ? (
                  <div
                    className="flex items-center justify-center text-center text-[11px] leading-tight"
                    style={{
                      flex: "1 1 auto",
                      minHeight: 0,
                      color: "var(--dd-muted)",
                      overflow: "hidden",
                    }}
                  >
                    —
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
                        compact={compact}
                        publicMode
                        showTelegramLinks={showTelegramLinks}
                        onClick={() => {
                          if (enableModal) setOpenEvent(ev);
                        }}
                        isExportMode={!enableModal}
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
                        onClick={() => {
                          if (enableModal) setOpenEvent(events[visible.length]);
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
        })}
      </div>

      <HomepageEventModal
        event={openEvent}
        project={project}
        onClose={() => setOpenEvent(null)}
      />
    </div>
  );
}
