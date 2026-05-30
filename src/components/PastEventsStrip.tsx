import { useMemo } from "react";
import { useCalendarStore } from "../state/calendarStore";
import { isoIsPast, formatHumanDate } from "../lib/calendar";

export function PastEventsStrip() {
  const project = useCalendarStore((s) => s.project);
  const openEditor = useCalendarStore((s) => s.openEditor);

  const past = useMemo(() => {
    return project.events
      .filter((e) => e.date.startsWith(project.month))
      .filter((e) => e.isPast || isoIsPast(e.date))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [project.events, project.month]);

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
          В этом месяце пока ничего не прошло. Здесь будут жить заметки и описания прошедших встреч.
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
              onClick={() => openEditor("edit", { eventId: ev.id })}
              className="text-left text-[16px] font-medium leading-tight"
              style={{
                color: "var(--dd-ink)",
                letterSpacing: "-0.01em",
              }}
            >
              {ev.title}
            </button>
            {ev.description && (
              <p
                className="line-clamp-3 text-[12px]"
                style={{ color: "var(--dd-muted)", lineHeight: 1.4 }}
              >
                {ev.description}
              </p>
            )}
          </article>
        ))}
      </div>
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
