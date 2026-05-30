import type { VercelRequest, VercelResponse } from "@vercel/node";

// GET /api/admin/webhook-info — статус webhook'а Telegram (для отладки).
// Защищено X-Admin-Secret.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
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
  try {
    const tgResp = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`,
    );
    const data = await tgResp.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "telegram_error",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
