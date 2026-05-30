import type {
  CalendarProject,
  EventItem,
  PublicCalendarResponse,
  PublicEventItem,
  VisibilityMode,
} from "./types";

// Превращаем приватный CalendarProject в безопасный публичный снимок.
// Используется и embed-виджетом, и homepage-режимом — везде, где данные
// показываются неавторизованным посетителям сайта deardesigners.club.

const ACCESS_LABEL = "Доступно участникам клуба";

export function isEventPublic(
  e: EventItem,
  project: CalendarProject,
): boolean {
  const calendarVisibility = project.publishSettings?.visibility ?? "public";
  if (calendarVisibility === "private") return false;

  const status = e.publishStatus ?? "published";
  if (status === "draft" || status === "review" || status === "hidden") {
    return false;
  }
  if (e.published === false) return false;

  const visibility: VisibilityMode = e.visibility ?? "public";
  if (visibility === "private") return false;

  return true;
}

export function toPublicEvent(
  e: EventItem,
  project: CalendarProject,
): PublicEventItem {
  const settings = project.publishSettings;
  const visibility: VisibilityMode = e.visibility ?? "public";
  const isHinted = visibility === "members_hint";
  const showImages = settings?.showImagesInPublicHomepage ?? true;
  const showTelegram = settings?.showTelegramLinks ?? true;

  return {
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.time,
    type: e.type,
    description: isHinted ? undefined : e.description,
    imageUrl: showImages ? e.imageUrl : undefined,
    imageDataUrl: showImages ? e.imageDataUrl : undefined,
    imageFit: e.imageFit,
    imageBackgroundMode: e.imageBackgroundMode,
    imageDominantColor: e.imageDominantColor,
    telegramPostUrl: showTelegram ? e.telegramPostUrl : undefined,
    telegramAccessLabel:
      showTelegram && e.telegramPostUrl ? ACCESS_LABEL : undefined,
    tags: e.tags,
    cardStyle: e.cardStyle,
  };
}

export function toPublicCalendar(
  project: CalendarProject,
): PublicCalendarResponse {
  const visible = project.events.filter((e) => isEventPublic(e, project));

  return {
    community: {
      id: "deardesigners",
      name: "Дорогие дизайнеры",
      slug: "deardesigners",
    },
    calendar: {
      id: project.id,
      title: project.title,
      month: project.month,
      updatedAt: project.updatedAt,
      presentationMode: project.homepageSettings.presentationMode,
    },
    events: visible.map((e) => toPublicEvent(e, project)),
    theme: project.theme,
    publishSettings: project.publishSettings,
    homepageSettings: project.homepageSettings,
  };
}
