// GET /api/admin/webhook-info — статус webhook'а у Telegram.

export async function GET(request: Request): Promise<Response> {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return Response.json(
      { error: "admin_secret_not_configured" },
      { status: 500 },
    );
  }
  if (request.headers.get("x-admin-secret") !== adminSecret) {
    return Response.json({ error: "bad_secret" }, { status: 401 });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return Response.json(
      { error: "telegram_bot_token_not_configured" },
      { status: 500 },
    );
  }
  try {
    const tgResp = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`,
    );
    const data = await tgResp.json();
    return Response.json(data, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error: "telegram_error",
        message: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
