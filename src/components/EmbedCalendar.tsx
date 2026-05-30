import { useEffect, useMemo, useState } from "react";
import { useCalendarStore } from "../state/calendarStore";
import { formatMonthKey, monthTitleRu, shiftMonth } from "../lib/calendar";
import type { AppModeContext } from "../lib/appMode";
import { applyEmbedTheme, embedRootStyle } from "../lib/embedTheme";
import { PublicCalendarGrid } from "./PublicCalendarGrid";
import { HomepageArchiveStrip } from "./HomepageArchiveStrip";
import { ArrowRight } from "./icons";
import { ToastStack } from "./Toast";

type Props = {
  context: AppModeContext;
};

// Минималистичный embed-виджет: только календарь, без hero/CTA/footer-обвязки.
// Подключается на сторонних сайтах (Tilda, Notion и т.д.) через
// <iframe src=".../embed?...">. Все query-параметры — опциональные.
export function EmbedCalendar({ context }: Props) {
  const project = useCalendarStore((s) => s.project);
  const bootstrap = useCalendarStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const initial = useMemo(
    () => context.monthOverride ?? formatMonthKey(new Date()),
    [context.monthOverride],
  );
  const [monthKey, setMonthKey] = useState(initial);
  useEffect(() => setMonthKey(initial), [initial]);

  const { settings } = context;

  // Дефолты embed-режима: компактные карточки, без архивного strip,
  // Telegram-ссылки берутся из admin-настроек проекта.
  const compact = settings.compact ?? true;
  const showPast = settings.showPast ?? false;
  const showTelegram =
    settings.showTelegramLinks ??
    (project.homepageSettings.showTelegramLinks &&
      project.publishSettings.showTelegramLinks);

  return (
    <div
      className={applyEmbedTheme(
        "relative px-3 pt-4 pb-6 md:px-5 md:pt-6 md:pb-8",
        settings.theme,
      )}
      style={{
        ...embedRootStyle(settings.theme, settings.height),
        color: "var(--dd-ink)",
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2
          className="font-display text-display-sm"
          style={{ color: "var(--dd-ink)" }}
        >
          {monthTitleRu(monthKey)}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="dd-month-arrow"
            onClick={() => setMonthKey((m) => shiftMonth(m, -1))}
            aria-label="Предыдущий месяц"
            style={{ width: 36, height: 36 }}
          >
            <ArrowRight rotate={180} />
          </button>
          <button
            type="button"
            className="dd-month-arrow"
            onClick={() => setMonthKey((m) => shiftMonth(m, 1))}
            aria-label="Следующий месяц"
            style={{ width: 36, height: 36 }}
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
          digest={false}
        />
      )}

      <footer
        className="pt-4 text-[11px]"
        style={{ color: "var(--dd-ink-soft)" }}
      >
        Календарь сообщества «Дорогие дизайнеры» · deardesigners.club
      </footer>

      <ToastStack />
    </div>
  );
}
