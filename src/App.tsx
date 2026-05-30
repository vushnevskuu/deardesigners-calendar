import { useMemo } from "react";
import { detectAppMode } from "./lib/appMode";
import { CalendarApp } from "./components/CalendarApp";
import { HomepageCalendar } from "./components/HomepageCalendar";
import { EmbedCalendar } from "./components/EmbedCalendar";
import { DigestCalendar } from "./components/DigestCalendar";

export function App() {
  // Один раз на mount определяем режим — он не меняется в рамках сессии.
  const ctx = useMemo(() => detectAppMode(), []);

  switch (ctx.mode) {
    case "homepage":
      return <HomepageCalendar context={ctx} />;
    case "embed":
      return <EmbedCalendar context={ctx} />;
    case "digest":
      return <DigestCalendar context={ctx} />;
    case "export-preview":
    case "admin":
    default:
      return <CalendarApp />;
  }
}
