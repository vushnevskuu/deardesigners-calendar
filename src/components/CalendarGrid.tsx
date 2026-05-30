import { useMemo } from "react";
import { useCalendarStore } from "../state/calendarStore";
import { buildMonthGrid, WEEKDAYS_RU_SHORT } from "../lib/calendar";
import { CalendarCell } from "./CalendarCell";

export function CalendarGrid() {
  const project = useCalendarStore((s) => s.project);

  const cells = useMemo(() => buildMonthGrid(project.month), [project.month]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof project.events>();
    project.events.forEach((e) => {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")));
    return map;
  }, [project.events]);

  return (
    <section className="px-6 pb-6 pt-5 md:px-10 md:pt-7" aria-label="Сетка календаря">
      <div
        className="grid grid-cols-7 gap-2 px-1 pb-3 text-[11px] font-normal uppercase tracking-[0.16em] md:gap-3"
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
        className="grid grid-cols-7 gap-2 md:gap-3"
        aria-label="Календарь на месяц"
      >
        {cells.map((c) => (
          <CalendarCell
            key={c.iso}
            cell={c}
            events={eventsByDate.get(c.iso) ?? []}
            materials={project.materials}
          />
        ))}
      </div>
    </section>
  );
}
