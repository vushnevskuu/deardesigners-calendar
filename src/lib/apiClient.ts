import type { EventItem } from "./types";

// API-клиент для публичных страниц календаря (homepage/embed/digest).
// admin-режим продолжает работать на localStorage.
//
// Если /api/events отдаёт 503 (postgres_not_configured) — это нормальное
// состояние до подключения БД. Фронт молча откатывается на локальные данные.

type ApiEvent = {
  id: string;
  date: string;
  time?: string;
  title: string;
  description?: string;
  type: EventItem["type"];
  imageUrl?: string;
  telegramPostUrl?: string;
  source: EventItem["source"];
  visibility: EventItem["visibility"];
  publishStatus: EventItem["publishStatus"];
  cardStyle?: EventItem["cardStyle"];
};

export type RemoteEventsResult =
  | { status: "ok"; events: EventItem[] }
  | { status: "not_configured" }
  | { status: "error"; message: string };

export async function fetchEventsByMonth(
  monthKey: string,
  signal?: AbortSignal,
): Promise<RemoteEventsResult> {
  try {
    const resp = await fetch(
      `/api/events?month=${encodeURIComponent(monthKey)}`,
      { signal },
    );
    if (resp.status === 503) {
      return { status: "not_configured" };
    }
    if (!resp.ok) {
      return {
        status: "error",
        message: `HTTP ${resp.status}`,
      };
    }
    const data = (await resp.json()) as { events: ApiEvent[] };
    const events: EventItem[] = (data.events ?? []).map((e) => ({
      id: e.id,
      date: e.date,
      time: e.time,
      title: e.title,
      description: e.description,
      type: e.type,
      imageUrl: e.imageUrl,
      telegramPostUrl: e.telegramPostUrl,
      source: e.source,
      visibility: e.visibility,
      publishStatus: e.publishStatus,
      published: e.publishStatus === "published",
      cardStyle: e.cardStyle,
      relatedMaterialIds: [],
    }));
    return { status: "ok", events };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "error", message: "aborted" };
    }
    return {
      status: "error",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}
