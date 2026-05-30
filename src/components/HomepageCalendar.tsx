import { useEffect, useMemo, useState } from "react";
import { useCalendarStore } from "../state/calendarStore";
import {
  formatMonthKey,
  monthTitleRu,
  shiftMonth,
} from "../lib/calendar";
import type { AppModeContext } from "../lib/appMode";
import { applyEmbedTheme, embedRootStyle } from "../lib/embedTheme";
import type { HomepageSettings } from "../lib/types";
import { HomepageHero } from "./HomepageHero";
import { HomepageMonthSwitch } from "./HomepageMonthSwitch";
import { HomepageCTA } from "./HomepageCTA";
import { HomepageArchiveStrip } from "./HomepageArchiveStrip";
import { PublicCalendarGrid } from "./PublicCalendarGrid";
import { ToastStack } from "./Toast";

type Props = {
  context: AppModeContext;
};

// Полноэкранная публичная главная для deardesigners.club.
// Не показывает редактор, drawer-ы, dnd, plus-кнопки. Только календарь как hero.
export function HomepageCalendar({ context }: Props) {
  const project = useCalendarStore((s) => s.project);
  const bootstrap = useCalendarStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const todayMonth = useMemo(() => formatMonthKey(new Date()), []);

  const homepageSettings: HomepageSettings = project.homepageSettings;

  // Определяем стартовый месяц с учётом URL и admin-настроек.
  const initialMonth = useMemo(() => {
    if (context.monthOverride) return context.monthOverride;
    switch (homepageSettings.defaultMonthMode) {
      case "previous":
        return shiftMonth(todayMonth, -1);
      case "specific":
        return homepageSettings.specificMonth ?? todayMonth;
      case "current":
      default:
        return todayMonth;
    }
  }, [context.monthOverride, homepageSettings, todayMonth]);

  const [monthKey, setMonthKey] = useState(initialMonth);
  useEffect(() => {
    setMonthKey(initialMonth);
  }, [initialMonth]);

  const presentationMode =
    context.presentationOverride ?? homepageSettings.presentationMode;
  const isDigest = presentationMode === "monthly-digest";

  // Query-параметры из URL могут override admin-настройки homepage.
  // Дефолты — из homepageSettings проекта; query — приоритетнее.
  const { settings } = context;
  const showTelegramLinks =
    settings.showTelegramLinks ?? homepageSettings.showTelegramLinks;
  const showPastStrip =
    settings.showPast ?? homepageSettings.showPastEventsStrip;
  const compactGrid = settings.compact ?? false;

  // Чуть подменяем заголовок и subtitle для digest-режима.
  const heroSettings: HomepageSettings = isDigest
    ? {
        ...homepageSettings,
        headline:
          homepageSettings.headline === "Месяц в Дорогих дизайнерах"
            ? "Как прошёл месяц в клубе"
            : homepageSettings.headline,
        subtitle:
          "Собрали встречи, обсуждения, разборы и материалы месяца в одном календаре.",
      }
    : homepageSettings;

  return (
    <div
      className={applyEmbedTheme(
        "relative min-h-screen",
        settings.theme,
      )}
      style={{
        ...embedRootStyle(settings.theme, settings.height),
        color: "var(--dd-ink)",
      }}
    >
      <HomepageHero settings={heroSettings} />
      <HomepageCTA settings={heroSettings} />

      {homepageSettings.showArchiveToggle && (
        <HomepageMonthSwitch
          todayMonth={todayMonth}
          currentMonth={monthKey}
          onChange={setMonthKey}
        />
      )}

      <section className="px-6 pt-6 pb-10 md:px-10 md:pt-10 md:pb-14">
        <div
          className="text-[11px] uppercase tracking-[0.18em]"
          style={{ color: "var(--dd-ink-soft)" }}
        >
          {isDigest ? "Архив месяца" : "Программа месяца"}
        </div>
        <h2
          className="mt-2 font-display text-display-md"
          style={{ color: "var(--dd-ink)" }}
        >
          {monthTitleRu(monthKey)}
        </h2>
        <div className="mt-6">
          <PublicCalendarGrid
            project={project}
            monthKey={monthKey}
            compact={compactGrid}
            showTelegramLinks={showTelegramLinks}
          />
        </div>
      </section>

      {showPastStrip && (
        <HomepageArchiveStrip
          project={project}
          monthKey={monthKey}
          digest={isDigest}
        />
      )}

      <footer
        className="px-6 pb-12 md:px-10"
        style={{ color: "var(--dd-ink-soft)" }}
      >
        <div className="text-[11px] uppercase tracking-[0.18em]">
          Дорогие дизайнеры · {monthTitleRu(monthKey)}
        </div>
        <div className="mt-1 text-[12px]">
          Часть ссылок и материалов доступна только участникам клуба.
        </div>
      </footer>

      <ToastStack />
    </div>
  );
}
