import { useEffect, useMemo, useState } from "react";
import { useCalendarStore } from "../state/calendarStore";
import {
  formatMonthKey,
  monthTitleRu,
  shiftMonth,
} from "../lib/calendar";
import type { AppModeContext } from "../lib/appMode";
import { applyEmbedTheme, embedRootStyle } from "../lib/embedTheme";
import { PublicCalendarGrid } from "./PublicCalendarGrid";
import { HomepageArchiveStrip } from "./HomepageArchiveStrip";
import { ArrowRight } from "./icons";
import { ToastStack } from "./Toast";

type Props = {
  context: AppModeContext;
};

// Режим «дайджест прошедшего месяца» — отдельный embed-сценарий.
// Используется для архивных страниц или monthly recap-блоков на Tilda.
// Без hero/CTA: только подзаголовок «Что было», сетка и архивный strip.
export function DigestCalendar({ context }: Props) {
  const project = useCalendarStore((s) => s.project);
  const bootstrap = useCalendarStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const initial = useMemo(() => {
    if (context.monthOverride) return context.monthOverride;
    // По умолчанию digest показывает предыдущий месяц.
    return shiftMonth(formatMonthKey(new Date()), -1);
  }, [context.monthOverride]);

  const [monthKey, setMonthKey] = useState(initial);
  useEffect(() => setMonthKey(initial), [initial]);

  const { settings } = context;
  const showTelegram =
    settings.showTelegramLinks ??
    (project.homepageSettings.showTelegramLinks &&
      project.publishSettings.showTelegramLinks);
  const showPast = settings.showPast ?? true;
  const compact = settings.compact ?? false;

  return (
    <div
      className={applyEmbedTheme(
        "relative px-4 pt-6 pb-8 md:px-8 md:pt-10 md:pb-12",
        settings.theme,
      )}
      style={{
        ...embedRootStyle(settings.theme, settings.height),
        color: "var(--dd-ink)",
      }}
    >
      <header className="flex flex-wrap items-end justify-between gap-3 pb-5 md:pb-7">
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--dd-ink-soft)" }}
          >
            Как прошёл месяц в клубе
          </div>
          <h1
            className="mt-2 font-display text-display-md"
            style={{ color: "var(--dd-ink)" }}
          >
            {monthTitleRu(monthKey)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="dd-month-arrow"
            onClick={() => setMonthKey((m) => shiftMonth(m, -1))}
            aria-label="Предыдущий месяц"
            style={{ width: 40, height: 40 }}
          >
            <ArrowRight rotate={180} />
          </button>
          <button
            type="button"
            className="dd-month-arrow"
            onClick={() => setMonthKey((m) => shiftMonth(m, 1))}
            aria-label="Следующий месяц"
            style={{ width: 40, height: 40 }}
          >
            <ArrowRight />
          </button>
        </div>
      </header>

      <PublicCalendarGrid
        project={project}
        monthKey={monthKey}
        compact={compact}
        showTelegramLinks={showTelegram}
      />

      {showPast && (
        <HomepageArchiveStrip
          project={project}
          monthKey={monthKey}
          digest
        />
      )}

      <footer
        className="pt-6 text-[11px]"
        style={{ color: "var(--dd-ink-soft)" }}
      >
        Дайджест клуба «Дорогие дизайнеры» · deardesigners.club
      </footer>

      <ToastStack />
    </div>
  );
}
