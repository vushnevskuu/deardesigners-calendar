import type { HomepageSettings } from "../lib/types";

type Props = {
  settings: HomepageSettings;
};

// Hero-секция публичной главной страницы.
// Тон редакторский: тонкий лейбл, крупный заголовок, человеческий subtitle.
export function HomepageHero({ settings }: Props) {
  if (!settings.showHeroText) return null;
  return (
    <header className="px-6 pt-10 md:px-10 md:pt-16">
      <div
        className="text-[12px] uppercase tracking-[0.22em]"
        style={{ color: "var(--dd-ink-soft)" }}
      >
        Дорогие дизайнеры
      </div>
      <h1
        className="mt-3 font-display text-display-xl"
        style={{ color: "var(--dd-ink)", lineHeight: 1.05 }}
      >
        {settings.headline}
      </h1>
      {settings.subtitle && (
        <p
          className="mt-4 max-w-2xl text-lg"
          style={{ color: "var(--dd-ink-soft)", lineHeight: 1.45 }}
        >
          {settings.subtitle}
        </p>
      )}
    </header>
  );
}
