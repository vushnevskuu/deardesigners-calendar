import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasPostgres, sql } from "../_lib/db";

// POST /api/admin/setup
// Идемпотентно создаёт таблицу events и индексы.
// Защищено заголовком X-Admin-Secret = env ADMIN_SECRET.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    res.status(500).json({ error: "admin_secret_not_configured" });
    return;
  }
  if (req.headers["x-admin-secret"] !== secret) {
    res.status(401).json({ error: "bad_secret" });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: "postgres_not_configured" });
    return;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id            TEXT PRIMARY KEY,
        date          DATE NOT NULL,
        time          TEXT,
        title         TEXT NOT NULL,
        description   TEXT,
        type          TEXT NOT NULL DEFAULT 'other',
        cover_url     TEXT,
        telegram_post_url TEXT,
        source        TEXT NOT NULL DEFAULT 'manual',
        visibility    TEXT NOT NULL DEFAULT 'public',
        publish_status TEXT NOT NULL DEFAULT 'published',
        card_style    TEXT,
        tg_chat_id    BIGINT,
        tg_message_id BIGINT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS events_date_idx ON events (date)`;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS events_tg_unique_idx
        ON events (tg_chat_id, tg_message_id)
        WHERE tg_chat_id IS NOT NULL AND tg_message_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS events_publish_idx
        ON events (publish_status, visibility)
    `;
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({
      error: "db_error",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
