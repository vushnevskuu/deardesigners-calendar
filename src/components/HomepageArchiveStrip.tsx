import { useMemo, useState } from "react";
import { formatHumanDate } from "../lib/calendar";
import { isEventPublic } from "../lib/publicApi";
import type { CalendarProject, EventItem } from "../lib/types";
import { SmartImage } from "./SmartImage";
import { HomepageEventModal } from "./HomepageEventModal";

type Props = {
  project: CalendarProject;
  monthKey: string;
  // Если true — это режим digest, прошедшие выводятся как «что было»,
  // а не как мелкая лента в подвале.
  digest?: boolean;
};

// Подвал прошедших событий месяца. Кликабельные карточки с миниатюрой.
export function HomepageArchiveStrip({ project, monthKey, digest }: Props) {
  const items = useMemo(() => {
    return project.events
      .filter((e) => e.date.startsWith(monthKey) && isEventPublic(e, project))
      .filter((e) => digest || isPastIso(e.date))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [project, monthKey, digest]);

  const [openEvent, setOpenEvent] = useState<EventItem | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="px-6 py-12 md:px-10 md:py-16">
      <div
        className="text-[11px] uppercase tracking-[0.18em]"
        style={{ color: "var(--dd-ink-soft)" }}
      >
        {digest ? "Что было в клубе" : "Уже прошло в этом месяце"}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setOpenEvent(e)}
            className="dd-card flex w-full items-stretch gap-3 overflow-hidden p-3 text-left transition hover:-translate-y-[1px]"
            style={{
              cursor: "pointer",
            }}
          >
            <div
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl"
              style={{
                background: e.imageDominantColor ?? "var(--dd-surface-soft)",
              }}
            >
              {e.imageDataUrl ? (
                <SmartImage
                  src={e.imageDataUrl}
                  fit="cover"
                  dominantColor={e.imageDominantColor}
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <div
                className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em]"
                style={{ color: "var(--dd-ink-soft)" }}
              >
                <span>{formatHumanDate(e.date)}</span>
                {e.time && <span>· {e.time}</span>}
              </div>
              <div className="truncate text-base font-medium leading-tight">
                {e.title || "Событие клуба"}
              </div>
              {e.description && (
                <p
                  className="line-clamp-2 text-[12px]"
                  style={{ color: "var(--dd-ink-soft)", lineHeight: 1.4 }}
                >
                  {e.description}
                </p>
              )}
              {e.telegramPostUrl && (
                <div
                  className="text-[11px]"
                  style={{ color: "var(--dd-ink-soft)" }}
                >
                  Telegram-пост · доступно участникам клуба
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      <HomepageEventModal
        event={openEvent}
        project={project}
        onClose={() => setOpenEvent(null)}
      />
    </section>
  );
}

function isPastIso(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  return (
    d.getTime() <
    new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  );
}
