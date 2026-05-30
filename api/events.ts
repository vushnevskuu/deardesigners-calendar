import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasPostgres, sql } from "./_lib/db";
import { rowToDto, type EventRow } from "./_lib/types";

// GET /api/events?month=YYYY-MM&includeDrafts=0
// Отдаёт события месяца. По дефолту — только published+public/members_hint.
// Если БД не подключена — отдаём 503 чтобы фронт откатился на демо.

const MONTH_RE = /^\d{4}-\d{2}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!hasPostgres()) {
    // Нет БД — возвращаем «не настроено», фронт сам пойдёт на demo.
    res.status(503).json({ error: "postgres_not_configured" });
    return;
  }

  const monthRaw = (req.query.month as string | undefined) ?? "";
  const includeDrafts =
    String(req.query.includeDrafts ?? "") === "1" ||
    String(req.query.includeDrafts ?? "") === "true";

  let monthKey = monthRaw;
  if (!MONTH_RE.test(monthKey)) {
    const now = new Date();
    monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  const [yyyy, mm] = monthKey.split("-").map((s) => parseInt(s, 10));
  // Первый и последний день месяца включительно (для DATE-сравнения).
  const monthStart = `${yyyy}-${String(mm).padStart(2, "0")}-01`;
  // last day = первый день следующего месяца минус 1 — Postgres делает сам.

  try {
    const rows = includeDrafts
      ? (
          await sql<EventRow>`
            SELECT * FROM events
            WHERE date >= ${monthStart}::date
              AND date < (${monthStart}::date + INTERVAL '1 month')
            ORDER BY date ASC, time NULLS LAST
          `
        ).rows
      : (
          await sql<EventRow>`
            SELECT * FROM events
            WHERE date >= ${monthStart}::date
              AND date < (${monthStart}::date + INTERVAL '1 month')
              AND publish_status = 'published'
              AND visibility <> 'private'
            ORDER BY date ASC, time NULLS LAST
          `
        ).rows;

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
    res.status(200).json({
      month: monthKey,
      events: rows.map(rowToDto),
    });
  } catch (err) {
    res.status(500).json({
      error: "db_error",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
