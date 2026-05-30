import { useMemo, useRef, useState } from "react";
import { useCalendarStore } from "../state/calendarStore";
import { monthTitleRu } from "../lib/calendar";
import { readJsonFile, validateMaterials, validateProject } from "../lib/export";
import { ArrowRight } from "./icons";
import { AutofillPanel } from "./AutofillPanel";
import { ToolbarMenu, type ToolbarMenuItem } from "./ToolbarMenu";

export function Toolbar() {
  const project = useCalendarStore((s) => s.project);
  const shiftMonthBy = useCalendarStore((s) => s.shiftMonthBy);
  const openEditor = useCalendarStore((s) => s.openEditor);
  const openExport = useCalendarStore((s) => s.openExport);
  const importProject = useCalendarStore((s) => s.importProject);
  const importMaterials = useCalendarStore((s) => s.importMaterials);
  const resetDemo = useCalendarStore((s) => s.resetDemo);
  const pushToast = useCalendarStore((s) => s.pushToast);

  const [autofillOpen, setAutofillOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const onImportClick = () => importInputRef.current?.click();

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = await readJsonFile<unknown>(file);
      if (validateProject(data)) {
        importProject(data);
        return;
      }
      if (validateMaterials(data)) {
        importMaterials(data);
        return;
      }
      pushToast("Не похоже на проект или фишки", "error");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Не удалось импортировать", "error");
    }
  };

  // Все служебные действия toolbar'а свернуты в одно меню «···».
  // Главная CTA-кнопка справа — Экспорт.
  const menuItems: ToolbarMenuItem[] = useMemo(
    () => [
      {
        id: "add-event",
        kind: "button",
        label: "Добавить событие",
        hint: "Новое событие в календарь",
        onClick: () => openEditor("create"),
      },
      {
        id: "autofill",
        kind: "button",
        label: "Собрать месяц из Telegram",
        hint: "Парсер пройдёт по сообщениям чата",
        onClick: () => setAutofillOpen(true),
      },
      { id: "sep-1", kind: "separator" },
      {
        id: "import",
        kind: "button",
        label: "Импорт JSON",
        hint: "Загрузить проект или фишки",
        onClick: onImportClick,
      },
      {
        id: "reset",
        kind: "button",
        label: "Сбросить демо",
        hint: "Вернуть seed-данные",
        tone: "danger",
        onClick: () => {
          if (confirm("Сбросить календарь к демо-данным?")) resetDemo();
        },
      },
      { id: "sep-2", kind: "separator" },
      {
        id: "homepage",
        kind: "link",
        label: "Открыть homepage ↗",
        hint: "Публичная главная страница",
        href: "?mode=homepage",
      },
      {
        id: "embed",
        kind: "link",
        label: "Открыть embed ↗",
        hint: "Виджет для вставки в Tilda",
        href: "?mode=embed",
      },
    ],
    // openEditor/openMaterials/resetDemo стабильны от zustand, но укажем явно
    // через no-op зависимость [project.id] чтобы memoize не цеплял лишнее.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project.id],
  );

  return (
    <header className="relative z-10 px-6 pt-6 md:px-10 md:pt-10">
      <div className="dd-card px-6 py-6 md:px-8 md:py-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-medium tracking-[0.04em]"
              style={{
                background: "var(--dd-ink)",
                color: "#ffffff",
              }}
              aria-label={project.title || "Дорогие дизайнеры"}
            >
              ДД
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <ToolbarMenu items={menuItems} ariaLabel="Действия календаря" />
            <button
              type="button"
              className="dd-cta dd-cta--filled"
              style={{ height: 38, paddingLeft: 16 }}
              onClick={() => openExport()}
              aria-label="Открыть панель экспорта"
            >
              <span>Экспорт</span>
              <span
                className="dd-cta__icon"
                style={{ width: 30, height: 30 }}
                aria-hidden
              >
                <ArrowRight />
              </span>
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              hidden
              onChange={onImportFile}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1
            className="font-display text-display-xl"
            style={{ color: "var(--dd-ink)" }}
          >
            {monthTitleRu(project.month)}
          </h1>
          <div className="dd-month-nav flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => shiftMonthBy(-1)}
              className="dd-month-arrow"
              aria-label="Предыдущий месяц"
            >
              <ArrowRight rotate={180} responsive />
            </button>
            <button
              type="button"
              onClick={() => shiftMonthBy(1)}
              className="dd-month-arrow"
              aria-label="Следующий месяц"
            >
              <ArrowRight responsive />
            </button>
          </div>
        </div>
      </div>
      <AutofillPanel open={autofillOpen} onClose={() => setAutofillOpen(false)} />
    </header>
  );
}
