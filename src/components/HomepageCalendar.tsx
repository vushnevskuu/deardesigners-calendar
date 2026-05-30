import { useEffect, useMemo, useState } from "react";
import { useCalendarStore } from "../state/calendarStore";
import { formatMonthKey, shiftMonth } from "../lib/calendar";
import type { AppModeContext } from "../lib/appMode";
import { applyEmbedTheme, embedRootStyle } from "../lib/embedTheme";
import type { CalendarProject, HomepageSettings } from "../lib/types";
import { PublicToolbar } from "./PublicToolbar";
import { PublicCalendarGrid } from "./PublicCalendarGrid";
import { PublicPastEventsStrip } from "./PublicPastEventsStrip";
import { HomepageArchiveStrip } from "./HomepageArchiveStrip";
import { ToastStack } from "./Toast";
import { useRemoteEvents } from "../hooks/useRemoteEvents";

type Props = {
  context: AppModeContext;
};

// Полноэкранная публичная главная для deardesigners.club.
// Визуально совпадает с admin-режимом (dd-card-тулбар + сетка + архив),
// но без редакторских контролов: drag&drop, plus-кнопок, меню «···» и
// кнопки «Экспорт». Это эталонный вид для встраивания на Tilda.
export function HomepageCalendar({ context }: Props) {
  const project = useCalendarStore((s) => s.project);
  const bootstrap = useCalendarStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const todayMonth = useMemo(() => formatMonthKey(new Date()), []);

  const homepageSettings: HomepageSettings = project.homepageSettings;

  // Стартовый месяц: URL ?month → admin-настройка → текущий.
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

  // URL-параметры могут переопределить admin-настройки homepage.
  const { settings } = context;
  const showTelegramLinks =
    settings.showTelegramLinks ?? homepageSettings.showTelegramLinks;
  const showPastStrip =
    settings.showPast ?? homepageSettings.showPastEventsStrip;
  const compactGrid = settings.compact ?? false;

  // Тянем события месяца из БД. Если БД не подключена (503) — используем
  // локальный project (демо/админский localStorage), чтобы эталонный вид не
  // ломался до подключения Postgres.
  const remote = useRemoteEvents(monthKey);
  const effectiveProject: CalendarProject = useMemo(() => {
    if (remote.state === "remote") {
      // Замещаем события месяца тем, что пришло из БД. Остальные месяцы
      // оставляем из локального project (на homepage всё равно показывается
      // только один месяц).
      const otherMonthEvents = project.events.filter(
        (e) => !e.date.startsWith(monthKey),
      );
      return {
        ...project,
        events: [...otherMonthEvents, ...remote.events],
      };
    }
    return project;
  }, [project, remote, monthKey]);

  return (
    <div
      className={applyEmbedTheme("relative min-h-screen", settings.theme)}
      style={{
        ...embedRootStyle(settings.theme, settings.height),
        color: "var(--dd-ink)",
      }}
    >
      <PublicToolbar
        monthKey={monthKey}
        onPrev={() => setMonthKey(shiftMonth(monthKey, -1))}
        onNext={() => setMonthKey(shiftMonth(monthKey, 1))}
      />

      <main>
        <section className="px-6 pb-6 pt-5 md:px-10 md:pt-7">
          <PublicCalendarGrid
            project={effectiveProject}
            monthKey={monthKey}
            compact={compactGrid}
            showTelegramLinks={showTelegramLinks}
          />
        </section>

        {showPastStrip &&
          (isDigest ? (
            <HomepageArchiveStrip
              project={effectiveProject}
              monthKey={monthKey}
              digest={isDigest}
            />
          ) : (
            <PublicPastEventsStrip project={effectiveProject} monthKey={monthKey} />
          ))}
      </main>

      <ToastStack />
    </div>
  );
}
