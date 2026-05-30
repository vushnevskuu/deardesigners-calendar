-- Схема Postgres для календаря «Дорогие дизайнеры».
-- Минимум для MVP: одна таблица events. Картинки храним в Vercel Blob,
-- в БД пишем только публичный URL.

CREATE TABLE IF NOT EXISTS events (
  -- Уникальный идентификатор события.
  id            TEXT PRIMARY KEY,
  -- Дата события (YYYY-MM-DD), берётся из текста поста; если в посте даты нет —
  -- ставится дата публикации поста.
  date          DATE NOT NULL,
  -- Время события (HH:MM) или NULL.
  time          TEXT,
  -- Заголовок события — первая строка/предложение поста.
  title         TEXT NOT NULL,
  -- Полное тело поста.
  description   TEXT,
  -- Тип события: talk, ui-circle, worman, offline, online, other (см. lib/types.ts).
  type          TEXT NOT NULL DEFAULT 'other',
  -- Картинка из поста, скачанная в Vercel Blob. Полный публичный URL.
  cover_url     TEXT,
  -- Постоянная ссылка на оригинальный пост в Telegram.
  telegram_post_url TEXT,
  -- Источник: telegram | manual | autofill.
  source        TEXT NOT NULL DEFAULT 'manual',
  -- Видимость: public | members_hint | private. По дефолту — public.
  visibility    TEXT NOT NULL DEFAULT 'public',
  -- Статус публикации: draft | published.
  publish_status TEXT NOT NULL DEFAULT 'published',
  -- Стиль карточки: auto | text-only | minimal | image. NULL = auto.
  card_style    TEXT,
  -- ID и chat_id поста в Telegram — нужны для дедупликации (один пост = одно событие).
  tg_chat_id    BIGINT,
  tg_message_id BIGINT,
  -- Метки времени.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс по месяцу для быстрого фильтра ?month=YYYY-MM.
CREATE INDEX IF NOT EXISTS events_date_idx ON events (date);

-- Дедупликация: один пост из TG = одно событие. NULL не считаются.
CREATE UNIQUE INDEX IF NOT EXISTS events_tg_unique_idx
  ON events (tg_chat_id, tg_message_id)
  WHERE tg_chat_id IS NOT NULL AND tg_message_id IS NOT NULL;

-- Индекс для отображения только опубликованных событий на homepage.
CREATE INDEX IF NOT EXISTS events_publish_idx ON events (publish_status, visibility);
