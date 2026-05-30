import { monthTitleRu, shiftMonth } from "../lib/calendar";

type Props = {
  todayMonth: string;
  currentMonth: string;
  onChange: (monthKey: string) => void;
};

// Переключатель «Этот месяц / Прошлый / Архив».
// Архив открывает выбор произвольного месяца через нативный <input type="month">.
export function HomepageMonthSwitch({
  todayMonth,
  currentMonth,
  onChange,
}: Props) {
  const previousMonth = shiftMonth(todayMonth, -1);
  const nextMonth = shiftMonth(todayMonth, 1);

  const isThis = currentMonth === todayMonth;
  const isPrev = currentMonth === previousMonth;
  const isNext = currentMonth === nextMonth;

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 pt-8 md:px-10 md:pt-12">
      <div
        className="text-[11px] uppercase tracking-[0.16em]"
        style={{ color: "var(--dd-ink-soft)" }}
      >
        Месяц клуба
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Toggle
          active={isPrev}
          label="Прошлый"
          onClick={() => onChange(previousMonth)}
        />
        <Toggle
          active={isThis}
          label="Этот месяц"
          onClick={() => onChange(todayMonth)}
        />
        <Toggle
          active={isNext}
          label="Следующий"
          onClick={() => onChange(nextMonth)}
        />
        <span
          className="ml-2 text-[12px] uppercase tracking-[0.14em]"
          style={{ color: "var(--dd-ink-soft)" }}
        >
          Архив:
        </span>
        <input
          type="month"
          className="dd-input"
          style={{ height: 36, maxWidth: 180 }}
          value={currentMonth}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Выбрать месяц"
        />
        <span
          className="text-[12px]"
          style={{ color: "var(--dd-ink-soft)" }}
        >
          → {monthTitleRu(currentMonth).toLowerCase()}
        </span>
      </div>
    </div>
  );
}

function Toggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2 text-sm font-medium transition"
      style={{
        background: active ? "var(--dd-ink)" : "var(--dd-surface-soft)",
        color: active ? "#ffffff" : "var(--dd-ink)",
      }}
    >
      {label}
    </button>
  );
}
