import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import { hasPostgres, sql } from "./_lib/db";
import { parsePost } from "./_lib/parser";

// POST /api/tg-webhook
// Принимает Telegram update (message или channel_post). Парсит, кладёт
// картинку в Vercel Blob, сохраняет событие в Postgres.
//
// Безопасность: TG отправляет header X-Telegram-Bot-Api-Secret-Token со
// значением, которое мы передавали в setWebhook(secret_token). Сравниваем
// его с env WEBHOOK_SECRET.

type TgPhoto = { file_id: string; file_unique_id: string; width: number; height: number; file_size?: number };
type TgUser = { id: number; is_bot: boolean; first_name?: string; username?: string };
type TgChat = { id: number; type: string; username?: string; title?: string };
type TgMessage = {
  message_id: number;
  date: number;
  chat: TgChat;
  from?: TgUser;
  sender_chat?: TgChat;
  text?: string;
  caption?: string;
  photo?: TgPhoto[];
  media_group_id?: string;
};
type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  channel_post?: TgMessage;
  edited_message?: TgMessage;
  edited_channel_post?: TgMessage;
};

function pickMessage(update: TgUpdate): TgMessage | null {
  return (
    update.channel_post ||
    update.message ||
    update.edited_channel_post ||
    update.edited_message ||
    null
  );
}

function buildTelegramPostUrl(chat: TgChat, messageId: number): string | undefined {
  if (chat.username) {
    return `https://t.me/${chat.username}/${messageId}`;
  }
  // Приватный канал/чат — public ссылка вида https://t.me/c/<id_without_-100>/<msg_id>
  const idStr = String(chat.id);
  if (idStr.startsWith("-100")) {
    return `https://t.me/c/${idStr.slice(4)}/${messageId}`;
  }
  return undefined;
}

// Скачивает фото через Telegram Bot API и кладёт в Vercel Blob.
// Возвращает публичный URL картинки в Blob — он не истекает.
async function downloadPhotoToBlob(
  fileId: string,
  botToken: string,
  hintName: string,
): Promise<string | null> {
  try {
    const fileMetaResp = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
    );
    const fileMeta = (await fileMetaResp.json()) as {
      ok: boolean;
      result?: { file_path?: string };
    };
    if (!fileMeta.ok || !fileMeta.result?.file_path) return null;
    const fileResp = await fetch(
      `https://api.telegram.org/file/bot${botToken}/${fileMeta.result.file_path}`,
    );
    if (!fileResp.ok) return null;
    const arrayBuf = await fileResp.arrayBuffer();
    const ext =
      fileMeta.result.file_path.split(".").pop()?.toLowerCase() ?? "jpg";
    const blob = await put(
      `telegram/${hintName}.${ext}`,
      Buffer.from(arrayBuf),
      {
        access: "public",
        addRandomSuffix: true,
      },
    );
    return blob.url;
  } catch {
    return null;
  }
}

export const config = {
  // Webhook должен отвечать быстро. 10 секунд хватит на скачивание картинки
  // среднего размера + Postgres insert.
  maxDuration: 15,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const got = req.headers["x-telegram-bot-api-secret-token"];
    if (got !== secret) {
      res.status(401).json({ error: "bad_secret" });
      return;
    }
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: "postgres_not_configured" });
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  // Без токена не сможем тянуть картинки. Текст события всё равно сохраним.

  const update = req.body as TgUpdate;
  const msg = pickMessage(update);
  if (!msg) {
    res.status(200).json({ ok: true, ignored: "no_message" });
    return;
  }

  const text = (msg.text ?? msg.caption ?? "").trim();
  // Если поста без текста — игнорируем (картинку без подписи нет смысла создавать).
  if (!text) {
    res.status(200).json({ ok: true, ignored: "empty_text" });
    return;
  }

  const postedAt = new Date(msg.date * 1000);
  const parsed = parsePost(text, postedAt);
  const telegramPostUrl = buildTelegramPostUrl(msg.chat, msg.message_id);

  // Берём самую большую фотку (последнюю в массиве photo).
  let coverUrl: string | null = null;
  if (msg.photo && msg.photo.length > 0 && botToken) {
    const biggest = msg.photo[msg.photo.length - 1];
    const hint = `${msg.chat.id}_${msg.message_id}`;
    coverUrl = await downloadPhotoToBlob(biggest.file_id, botToken, hint);
  }

  // ID события — стабильный, основан на chat+message, чтобы апдейты могли
  // обновить ту же запись.
  const id = `tg_${msg.chat.id}_${msg.message_id}`.replace(/[^a-z0-9_]/gi, "_");

  try {
    await sql`
      INSERT INTO events (
        id, date, time, title, description, type,
        cover_url, telegram_post_url, source, visibility, publish_status,
        tg_chat_id, tg_message_id, updated_at
      ) VALUES (
        ${id}, ${parsed.date}::date, ${parsed.time ?? null}, ${parsed.title}, ${parsed.description}, ${parsed.type},
        ${coverUrl}, ${telegramPostUrl ?? null}, 'telegram', 'public', 'published',
        ${msg.chat.id}, ${msg.message_id}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        date           = EXCLUDED.date,
        time           = EXCLUDED.time,
        title          = EXCLUDED.title,
        description    = EXCLUDED.description,
        type           = EXCLUDED.type,
        cover_url      = COALESCE(EXCLUDED.cover_url, events.cover_url),
        telegram_post_url = EXCLUDED.telegram_post_url,
        updated_at     = NOW();
    `;

    res.status(200).json({
      ok: true,
      id,
      date: parsed.date,
      time: parsed.time ?? null,
      title: parsed.title,
      coverUrl,
    });
  } catch (err) {
    res.status(500).json({
      error: "db_error",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
