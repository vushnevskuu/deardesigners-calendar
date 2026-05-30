import { hasPostgres, getSql } from "../_lib/db.js";

// POST /api/admin/setup
// Идемпотентно создаёт таблицу events и индексы.

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return Response.json(
      { error: "admin_secret_not_configured" },
      { status: 500 },
    );
  }
  if (request.headers.get("x-admin-secret") !== secret) {
    return Response.json({ error: "bad_secret" }, { status: 401 });
  }

  if (!hasPostgres()) {
    return Response.json(
      { error: "postgres_not_configured" },
      { status: 503 },
    );
  }

  try {
    const sql = getSql();
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
    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error: "db_error",
        message: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
