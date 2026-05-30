import { hasPostgres, getSql } from "./_lib/db";
import { rowToDto, type EventRow } from "./_lib/types";

// GET /api/events?month=YYYY-MM&includeDrafts=0
// Web API формат — работает как с Node, так и с Edge Runtime.

const MONTH_RE = /^\d{4}-\d{2}$/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request): Promise<Response> {
  if (!hasPostgres()) {
    return Response.json(
      { error: "postgres_not_configured" },
      { status: 503, headers: corsHeaders },
    );
  }

  const url = new URL(request.url);
  const monthRaw = url.searchParams.get("month") ?? "";
  const includeDrafts =
    url.searchParams.get("includeDrafts") === "1" ||
    url.searchParams.get("includeDrafts") === "true";

  let monthKey = monthRaw;
  if (!MONTH_RE.test(monthKey)) {
    const now = new Date();
    monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  const [yyyy, mm] = monthKey.split("-").map((s) => parseInt(s, 10));
  const monthStart = `${yyyy}-${String(mm).padStart(2, "0")}-01`;

  try {
    const sql = getSql();
    const rows = (includeDrafts
      ? ((await sql`
          SELECT * FROM events
          WHERE date >= ${monthStart}::date
            AND date < (${monthStart}::date + INTERVAL '1 month')
          ORDER BY date ASC, time NULLS LAST
        `) as unknown as EventRow[])
      : ((await sql`
          SELECT * FROM events
          WHERE date >= ${monthStart}::date
            AND date < (${monthStart}::date + INTERVAL '1 month')
            AND publish_status = 'published'
            AND visibility <> 'private'
          ORDER BY date ASC, time NULLS LAST
        `) as unknown as EventRow[]));

    return Response.json(
      {
        month: monthKey,
        events: rows.map(rowToDto),
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      },
    );
  } catch (err) {
    return Response.json(
      {
        error: "db_error",
        message: err instanceof Error ? err.message : "unknown",
      },
      { status: 500, headers: corsHeaders },
    );
  }
}
