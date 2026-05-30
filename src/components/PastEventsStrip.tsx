import { useMemo } from "react";
import { useCalendarStore } from "../state/calendarStore";
import { isoIsPast, formatHumanDate } from "../lib/calendar";
import { EVENT_TYPE_LABEL } from "../lib/types";
import { materialsForEvent } from "../lib/materials";
import { SparkleIcon } from "./icons";

export function PastEventsStrip() {
  const project = useCalendarStore((s) => s.project);
  const openEditor = useCalendarStore((s) => s.openEditor);
  const openMaterials = useCalendarStore((s) => s.openMaterials);

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
          В этом месяце пока ничего не прошло. Здесь будут жить заметки и фишки прошедших встреч.
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 pb-14 md:px-10" aria-label="Прошедшие события">
      <Header />
      <div className="dd-scroll -mx-2 flex gap-3 overflow-x-auto px-2 pb-2">
        {past.map((ev) => {
          const linked = materialsForEvent(ev, project.materials);
          return (
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
                <span>{EVENT_TYPE_LABEL[ev.type]}</span>
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
                  className="line-clamp-2 text-[12px]"
                  style={{ color: "var(--dd-muted)" }}
                >
                  {ev.description}
                </p>
              )}
              {linked.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {linked.slice(0, 4).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        if (m.url) window.open(m.url, "_blank", "noreferrer");
                        else openMaterials();
                      }}
                      className="dd-chip-soft"
                      title={m.section}
                    >
                      <SparkleIcon />
                      <span className="max-w-[160px] truncate">{m.title}</span>
                    </button>
                  ))}
                  {linked.length > 4 && (
                    <span className="dd-chip-soft">+{linked.length - 4}</span>
                  )}
                </div>
              )}
            </article>
          );
        })}
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
