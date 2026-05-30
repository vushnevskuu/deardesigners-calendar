// Общие типы для серверных функций. Не импортируются с фронта — всё что
// нужно фронту, лежит в src/lib/types.ts.

export type EventTypeDb =
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

export type VisibilityDb = "public" | "members_hint" | "private";
export type PublishStatusDb = "draft" | "review" | "published" | "hidden";
export type SourceDb = "manual" | "telegram" | "import" | "autofill";
export type CardStyleDb =
  | "photo"
  | "minimal"
  | "icon"
  | "text-only"
  | "raw-image"
  | null;

// Строка из таблицы events ровно так, как её возвращает Postgres (snake_case).
export type EventRow = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string | null;
  title: string;
  description: string | null;
  type: EventTypeDb;
  cover_url: string | null;
  telegram_post_url: string | null;
  source: SourceDb;
  visibility: VisibilityDb;
  publish_status: PublishStatusDb;
  card_style: CardStyleDb;
  tg_chat_id: string | null;
  tg_message_id: string | null;
  created_at: string;
  updated_at: string;
};

// То, что отдаём фронту — camelCase, как в src/lib/types.ts EventItem.
export type EventDto = {
  id: string;
  date: string;
  time?: string;
  title: string;
  description?: string;
  type: EventTypeDb;
  imageUrl?: string;
  telegramPostUrl?: string;
  source: SourceDb;
  visibility: VisibilityDb;
  publishStatus: PublishStatusDb;
  cardStyle?: CardStyleDb;
};

export function rowToDto(row: EventRow): EventDto {
  return {
    id: row.id,
    date: row.date,
    time: row.time ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    imageUrl: row.cover_url ?? undefined,
    telegramPostUrl: row.telegram_post_url ?? undefined,
    source: row.source,
    visibility: row.visibility,
    publishStatus: row.publish_status,
    cardStyle: row.card_style ?? undefined,
  };
}
