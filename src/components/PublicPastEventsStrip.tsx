import { useMemo, useState } from "react";
import { isoIsPast, formatHumanDate } from "../lib/calendar";
import { isEventPublic } from "../lib/publicApi";
import type { CalendarProject, EventItem } from "../lib/types";
import { HomepageEventModal } from "./HomepageEventModal";

type Props = {
  project: CalendarProject;
  monthKey: string;
};

// Публичный «Архив месяца» в admin-стиле: горизонтальный скрол с белыми
// карточками 280px, заголовок «Что уже было». Совпадает визуально с
// PastEventsStrip из admin-режима, но без editor-кнопок — клик открывает
// HomepageEventModal.
export function PublicPastEventsStrip({ project, monthKey }: Props) {
  const past = useMemo(
    () =>
      project.events
        .filter((e) => e.date.startsWith(monthKey))
        .filter((e) => isEventPublic(e, project))
        .filter((e) => e.isPast || isoIsPast(e.date))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [project, monthKey],
  );

  const [openEvent, setOpenEvent] = useState<EventItem | null>(null);

  if (past.length === 0) {
    return (
      <section className="px-6 pb-12 md:px-10" aria-label="Прошедшие события">
        <Header />
        <div
          className="rounded-dd-card p-6 text-[14px]"
          style={{
            background: "var(--dd-surface)",
            color: "var(--dd-muted)",
          }}
        >
          В этом месяце пока ничего не прошло. Здесь будут жить заметки и
          описания прошедших встреч.
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 pb-14 md:px-10" aria-label="Прошедшие события">
      <Header />
      <div className="dd-scroll -mx-2 flex gap-3 overflow-x-auto px-2 pb-2">
        {past.map((ev) => (
          <article
            key={ev.id}
            className="flex w-[280px] shrink-0 flex-col gap-2 rounded-dd-card p-5"
            style={{ background: "var(--dd-surface)" }}
          >
            <div
              className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.14em]"
              style={{ color: "var(--dd-muted)" }}
            >
              <span>{formatHumanDate(ev.date)}</span>
              {ev.time && <span>{ev.time}</span>}
            </div>
            <button
              type="button"
              onClick={() => setOpenEvent(ev)}
              className="text-left text-[16px] font-medium leading-tight"
              style={{
                color: "var(--dd-ink)",
                letterSpacing: "-0.01em",
              }}
            >
              {ev.title || "Событие клуба"}
            </button>
            {ev.description && (
              <p
                className="line-clamp-3 text-[12px]"
                style={{ color: "var(--dd-muted)", lineHeight: 1.4 }}
              >
                {ev.description}
              </p>
            )}
            {ev.telegramPostUrl && (
              <div
                className="text-[11px]"
                style={{ color: "var(--dd-ink-soft)" }}
              >
                Telegram-пост · доступно участникам клуба
              </div>
            )}
          </article>
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

function Header() {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2
        className="font-display text-display-md"
        style={{ color: "var(--dd-ink)" }}
      >
        Что уже было
      </h2>
      <span className="dd-label">Архив месяца</span>
    </div>
  );
}
