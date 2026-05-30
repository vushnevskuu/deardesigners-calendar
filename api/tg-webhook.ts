import { put } from "@vercel/blob";
import { hasPostgres, getSql } from "./_lib/db";
import { parsePost } from "./_lib/parser";

// POST /api/tg-webhook
// Принимает Telegram update (message / channel_post). Парсит, заливает
// картинку в Vercel Blob, делает upsert в Postgres.

type TgPhoto = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};
type TgUser = {
  id: number;
  is_bot: boolean;
  first_name?: string;
  username?: string;
};
type TgChat = {
  id: number;
  type: string;
  username?: string;
  title?: string;
};
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
  const idStr = String(chat.id);
  if (idStr.startsWith("-100")) {
    return `https://t.me/c/${idStr.slice(4)}/${messageId}`;
  }
  return undefined;
}

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
  // Webhook должен ответить быстро. 15 секунд хватает на скачивание
  // средней картинки + Postgres insert.
  maxDuration: 15,
};

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const got = request.headers.get("x-telegram-bot-api-secret-token");
    if (got !== secret) {
      return Response.json({ error: "bad_secret" }, { status: 401 });
    }
  }

  if (!hasPostgres()) {
    return Response.json(
      { error: "postgres_not_configured" },
      { status: 503 },
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }

  const msg = pickMessage(update);
  if (!msg) {
    return Response.json({ ok: true, ignored: "no_message" }, { status: 200 });
  }

  const text = (msg.text ?? msg.caption ?? "").trim();
  if (!text) {
    return Response.json({ ok: true, ignored: "empty_text" }, { status: 200 });
  }

  const postedAt = new Date(msg.date * 1000);
  const parsed = parsePost(text, postedAt);
  const telegramPostUrl = buildTelegramPostUrl(msg.chat, msg.message_id);

  let coverUrl: string | null = null;
  if (msg.photo && msg.photo.length > 0 && botToken) {
    const biggest = msg.photo[msg.photo.length - 1];
    const hint = `${msg.chat.id}_${msg.message_id}`;
    coverUrl = await downloadPhotoToBlob(biggest.file_id, botToken, hint);
  }

  const id = `tg_${msg.chat.id}_${msg.message_id}`.replace(/[^a-z0-9_]/gi, "_");

  try {
    const sql = getSql();
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

    return Response.json(
      {
        ok: true,
        id,
        date: parsed.date,
        time: parsed.time ?? null,
        title: parsed.title,
        coverUrl,
      },
      { status: 200 },
    );
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
