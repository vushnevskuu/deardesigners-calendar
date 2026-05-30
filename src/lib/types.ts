export type EventType =
  | "talk"
  | "practice"
  | "ui-circle"
  | "chat"
  | "coworking"
  | "discussion"
  | "offline"
  | "breakfast"
  | "portfolio"
  | "materials"
  | "other";

export type CardStyle =
  | "photo"
  | "minimal"
  | "icon"
  | "text-only"
  | "raw-image";

export type ImageFit = "cover" | "contain" | "smart";

export type ImageBackgroundMode =
  | "blurred-fill"
  | "dominant-color"
  | "solid"
  | "none";

export type EventSource = "manual" | "telegram" | "import" | "autofill";

export type PublishStatus = "draft" | "review" | "published" | "hidden";

export type VisibilityMode = "public" | "members_hint" | "private";

export type AppMode = "admin" | "homepage" | "embed" | "digest" | "export-preview";

export type CalendarPresentationMode = "upcoming" | "monthly-digest" | "archive";

// Тема визуала, которую можно прокидывать через query (?theme=...) для iframe.
// Маппится на ThemeSettings.backgroundStyle: light/clean → clean, paper → paper.
export type EmbedTheme = "light" | "clean" | "paper";

// Что-как показать в iframe-режимах (embed/homepage/digest).
// Все поля опциональные — undefined значит «использовать дефолт компонента».
export type EmbedQuerySettings = {
  view?: "calendar" | "digest" | "compact";
  compact?: boolean;
  showPast?: boolean;
  showMaterials?: boolean;
  showTelegramLinks?: boolean;
  theme?: EmbedTheme;
  height?: "auto" | "fixed";
};

export type EventItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: EventType;
  description?: string;
  imageDataUrl?: string;
  imageUrl?: string;
  imageFit?: ImageFit;
  imagePosition?: string;
  imageBackgroundMode?: ImageBackgroundMode;
  imageDominantColor?: string;
  imageAspectRatio?: number;
  imageIsMostlyWhite?: boolean;
  imageLooksLikeScreenshot?: boolean;
  link?: string;
  telegramPostUrl?: string;
  telegramMessageId?: string;
  telegramChatId?: string;
  source?: EventSource;
  sourceMessageIds?: string[];
  tags?: string[];
  isPast?: boolean;
  cardStyle?: CardStyle;
  relatedMaterialIds?: string[];
  publishStatus?: PublishStatus;
  visibility?: VisibilityMode;
  published?: boolean;
};

export type TelegramMediaItem = {
  id: string;
  type: "photo" | "video" | "document" | "animation" | "other";
  fileId?: string;
  fileUniqueId?: string;
  localUrl?: string;
  remoteUrl?: string;
  dataUrl?: string;
  width?: number;
  height?: number;
  caption?: string;
};

export type RawTelegramMessage = {
  id: string;
  chatId: string;
  messageId: string;
  date: string; // ISO date or YYYY-MM-DDTHH:MM
  authorName?: string;
  text?: string;
  caption?: string;
  media?: TelegramMediaItem[];
  links?: string[];
  telegramPostUrl?: string;
  replyToMessageId?: string;
  groupedId?: string;
  raw?: unknown;
};

export type TelegramPostReference = {
  id: string;
  chatId: string;
  messageId: string;
  url: string;
  date: string;
  text?: string;
  mediaIds?: string[];
  isAccessibleOnlyForMembers: boolean;
};

export type AutoDetectedEvent = {
  id: string;
  confidence: number; // 0..1
  status: "draft" | "approved" | "rejected";
  title: string;
  date: string;
  time?: string;
  type: EventType;
  description?: string;
  imageCandidates?: TelegramMediaItem[];
  selectedImageId?: string;
  telegramPostUrl?: string;
  sourceMessageIds: string[];
  reasoning?: string;
};

export type MonthlyAutofillDraft = {
  id: string;
  month: string;
  source: "telegram";
  createdAt: string;
  status: "draft" | "approved" | "imported";
  detectedEvents: AutoDetectedEvent[];
  unresolvedMessages: RawTelegramMessage[];
};

export type CalendarPublishSettings = {
  visibility: VisibilityMode;
  showTelegramLinks: boolean;
  showPrivateContentHints: boolean;
  showImagesInPublicHomepage: boolean;
  showMaterialsInPublicHomepage: boolean;
  requireManualApprovalBeforePublish: boolean;
};

export type HomepageSettings = {
  defaultMonthMode: "current" | "previous" | "specific";
  specificMonth?: string; // YYYY-MM
  presentationMode: CalendarPresentationMode;
  showHeroText: boolean;
  showCTA: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
  showTelegramLinks: boolean;
  showPastEventsStrip: boolean;
  showMaterials: boolean;
  showArchiveToggle: boolean;
  headline: string;
  subtitle: string;
};

export type MaterialType =
  | "lecture"
  | "discussion"
  | "practice"
  | "reference"
  | "case"
  | "recommendation"
  | "exercise"
  | "portfolio"
  | "link"
  | "other";

export type MaterialItem = {
  id: string;
  title: string;
  section: string;
  description?: string;
  url?: string;
  tags?: string[];
  type?: MaterialType;
  createdAt?: string;
  updatedAt?: string;
};

export type ThemeSettings = {
  name: string;
  backgroundStyle: "paper" | "clean" | "dots" | "poster";
  accentColor: string;
  radius: "soft" | "round" | "sharp";
  density: "airy" | "normal" | "compact";
};

export type ExportPreset =
  | "instagram-square"
  | "instagram-portrait"
  | "stories"
  | "telegram-post"
  | "website-embed"
  | "a4";

export type ExportSettings = {
  preset: ExportPreset;
  showPastEvents: boolean;
  showMaterials: boolean;
  showEventImages: boolean;
  compactMode: boolean;
  includeHeader: boolean;
  includeMonthTitle: boolean;
  scale: number;
};

export type CalendarProject = {
  id: string;
  title: string;
  month: string; // YYYY-MM
  events: EventItem[];
  materials: MaterialItem[];
  theme: ThemeSettings;
  exportSettings: ExportSettings;
  homepageSettings: HomepageSettings;
  publishSettings: CalendarPublishSettings;
  rawTelegramMessages?: RawTelegramMessage[]; // mock-источник для autofill
  autofillDraft?: MonthlyAutofillDraft | null;
  updatedAt: string;
};

export type ToastItem = {
  id: string;
  message: string;
  tone?: "info" | "success" | "error";
};

// Public API контракт для embed-виджета и homepage iframe.
export type PublicEventItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: EventType;
  description?: string;
  imageUrl?: string;
  imageDataUrl?: string;
  imageFit?: ImageFit;
  imageBackgroundMode?: ImageBackgroundMode;
  imageDominantColor?: string;
  telegramPostUrl?: string;
  telegramAccessLabel?: string;
  tags?: string[];
  cardStyle?: CardStyle;
};

export type PublicCalendarResponse = {
  community: {
    id: string;
    name: string;
    slug: string;
  };
  calendar: {
    id: string;
    title: string;
    month: string;
    updatedAt: string;
    presentationMode: CalendarPresentationMode;
  };
  events: PublicEventItem[];
  theme: ThemeSettings;
  publishSettings: CalendarPublishSettings;
  homepageSettings: HomepageSettings;
};

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  talk: "Лекция",
  practice: "Практика",
  "ui-circle": "UI-кружок",
  chat: "Болталка",
  coworking: "Коворкинг",
  discussion: "Дискуссия",
  offline: "Оффлайн",
  breakfast: "Завтрак",
  portfolio: "Портфолио",
  materials: "Материалы",
  other: "Событие",
};

export const MATERIAL_TYPE_LABEL: Record<MaterialType, string> = {
  lecture: "Лекция",
  discussion: "Обсуждение",
  practice: "Практика",
  reference: "Референс",
  case: "Кейс",
  recommendation: "Рекомендация",
  exercise: "Упражнение",
  portfolio: "Портфолио",
  link: "Ссылка",
  other: "Другое",
};

export const EVENT_TYPES: EventType[] = [
  "talk",
  "practice",
  "ui-circle",
  "chat",
  "coworking",
  "discussion",
  "offline",
  "breakfast",
  "portfolio",
  "materials",
  "other",
];

export const MATERIAL_TYPES: MaterialType[] = [
  "lecture",
  "discussion",
  "practice",
  "reference",
  "case",
  "recommendation",
  "exercise",
  "portfolio",
  "link",
  "other",
];

export const CARD_STYLES: CardStyle[] = [
  "photo",
  "raw-image",
  "minimal",
  "icon",
  "text-only",
];

export const EXPORT_PRESETS: { id: ExportPreset; label: string; w: number; h: number | null }[] = [
  { id: "instagram-square", label: "Instagram 1:1", w: 1080, h: 1080 },
  { id: "instagram-portrait", label: "Instagram 4:5", w: 1080, h: 1350 },
  { id: "stories", label: "Stories / Reels", w: 1080, h: 1920 },
  { id: "telegram-post", label: "Telegram 16:9", w: 1280, h: 720 },
  { id: "website-embed", label: "Web 16:9", w: 1600, h: 900 },
  { id: "a4", label: "A4 портрет", w: 1240, h: 1754 },
];
