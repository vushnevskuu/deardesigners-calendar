import type { HomepageSettings } from "../lib/types";

type Props = {
  settings: HomepageSettings;
};

// CTA-блок: только если включен в admin.
// На MVP — простая кнопка-ссылка, никакой регистрации.
export function HomepageCTA({ settings }: Props) {
  if (!settings.showCTA) return null;
  const label = settings.ctaLabel?.trim() || "Вступить в клуб";
  const url = settings.ctaUrl?.trim() || "https://t.me/+deardesigners";
  return (
    <div className="px-6 pt-6 md:px-10 md:pt-8">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="dd-cta dd-cta--filled"
        style={{ textDecoration: "none" }}
      >
        <span>{label}</span>
        <span className="dd-cta__icon" aria-hidden>
          ↗
        </span>
      </a>
    </div>
  );
}
