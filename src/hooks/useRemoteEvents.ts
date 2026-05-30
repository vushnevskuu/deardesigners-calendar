import { useEffect, useState } from "react";
import type { EventItem } from "../lib/types";
import { fetchEventsByMonth } from "../lib/apiClient";

// Хук для публичных режимов: пытается тянуть события из /api/events.
// Возвращает:
// - { state: "loading" }   — пока ждём ответ
// - { state: "remote", events } — БД ответила (массив может быть пустой)
// - { state: "fallback" }  — БД не настроена (503) или ошибка → используй локальное
//
// Подразумевается, что компонент при "fallback" продолжает использовать
// project.events из useCalendarStore, и админ-режим продолжает работать как раньше.

export type RemoteEventsState =
  | { state: "loading" }
  | { state: "remote"; events: EventItem[] }
  | { state: "fallback"; reason: "not_configured" | "error"; message?: string };

export function useRemoteEvents(monthKey: string): RemoteEventsState {
  const [result, setResult] = useState<RemoteEventsState>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setResult({ state: "loading" });
    fetchEventsByMonth(monthKey, controller.signal).then((res) => {
      if (controller.signal.aborted) return;
      if (res.status === "ok") {
        setResult({ state: "remote", events: res.events });
      } else if (res.status === "not_configured") {
        setResult({ state: "fallback", reason: "not_configured" });
      } else {
        setResult({ state: "fallback", reason: "error", message: res.message });
      }
    });
    return () => controller.abort();
  }, [monthKey]);

  return result;
}
