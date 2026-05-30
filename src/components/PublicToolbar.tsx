import { monthTitleRu } from "../lib/calendar";
import { ArrowRight } from "./icons";

type Props = {
  monthKey: string;
  onPrev: () => void;
  onNext: () => void;
  // Опционально подменяем заголовок ДД-шильда (для homepage по умолчанию
  // "Дорогие дизайнеры").
  brandLabel?: string;
};

// Публичный тулбар для homepage/digest. Визуально совпадает с admin Toolbar:
// та же dd-card, тот же ДД-шильд слева, тот же h1-заголовок месяца справа,
// те же круглые стрелки месяца. Но без меню «···», без кнопки «Экспорт» и
// без plus-кнопок — это чистый read-only header для лендинга.
export function PublicToolbar({ monthKey, onPrev, onNext, brandLabel }: Props) {
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
              aria-label={brandLabel || "Дорогие дизайнеры"}
            >
              ДД
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1
            className="font-display text-display-xl"
            style={{ color: "var(--dd-ink)" }}
          >
            {monthTitleRu(monthKey)}
          </h1>
          <div className="dd-month-nav flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={onPrev}
              className="dd-month-arrow"
              aria-label="Предыдущий месяц"
            >
              <ArrowRight rotate={180} responsive />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="dd-month-arrow"
              aria-label="Следующий месяц"
            >
              <ArrowRight responsive />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
