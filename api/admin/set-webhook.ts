// POST /api/admin/set-webhook
// Регистрирует webhook у Telegram. Защищено X-Admin-Secret.

export async function POST(request: Request): Promise<Response> {
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

  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    return Response.json(
      { error: "webhook_secret_not_configured" },
      { status: 500 },
    );
  }

  let body: { url?: string } = {};
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      body = (await request.json()) as { url?: string };
    }
  } catch {
    body = {};
  }

  let url = body.url;
  if (!url) {
    const fwdHost = request.headers.get("x-forwarded-host");
    const host = fwdHost || new URL(request.url).host;
    const proto = request.headers.get("x-forwarded-proto") || "https";
    url = `${proto}://${host}/api/tg-webhook`;
  }

  try {
    const tgResp = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          secret_token: webhookSecret,
          allowed_updates: [
            "message",
            "channel_post",
            "edited_message",
            "edited_channel_post",
          ],
          drop_pending_updates: false,
        }),
      },
    );
    const tgData = await tgResp.json();
    return Response.json({ ok: true, url, telegram: tgData }, { status: 200 });
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
