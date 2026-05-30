import type { VercelRequest, VercelResponse } from "@vercel/node";

// POST /api/admin/set-webhook
// Регистрирует webhook у Telegram. Использует env TELEGRAM_BOT_TOKEN
// и WEBHOOK_SECRET. Защищено X-Admin-Secret = env ADMIN_SECRET.
//
// Body (необязательное):
//   { "url": "https://deardesigners-calendar.vercel.app/api/tg-webhook" }
// Если не передавать — соберём URL из заголовков запроса.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    res.status(500).json({ error: "admin_secret_not_configured" });
    return;
  }
  if (req.headers["x-admin-secret"] !== adminSecret) {
    res.status(401).json({ error: "bad_secret" });
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    res.status(500).json({ error: "telegram_bot_token_not_configured" });
    return;
  }

  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(500).json({ error: "webhook_secret_not_configured" });
    return;
  }

  const body = (req.body || {}) as { url?: string };
  let url = body.url;
  if (!url) {
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = req.headers["x-forwarded-proto"] || "https";
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
    res.status(200).json({ ok: true, url, telegram: tgData });
  } catch (err) {
    res.status(500).json({
      error: "telegram_error",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
