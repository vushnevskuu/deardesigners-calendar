import type {
  AutoDetectedEvent,
  EventType,
  MonthlyAutofillDraft,
  RawTelegramMessage,
} from "./types";
import { nanoid } from "nanoid";

// Rule-based парсер сообщений Telegram-чата клуба для MVP.
// Делает грубую разметку: ищет дату, время, ключевые слова про тип события и
// собирает черновики, которые человек ДОЛЖЕН проверить перед публикацией.
//
// Намеренно НЕ:
// - не делает запросов в реальный Telegram;
// - не публикует ничего автоматически;
// - не пытается «угадать» секретные/чувствительные тексты как публичные.

const MONTHS_RU: Record<string, number> = {
  января: 1,
  февраля: 2,
  марта: 3,
  апреля: 4,
  мая: 5,
  июня: 6,
  июля: 7,
  августа: 8,
  сентября: 9,
  октября: 10,
  ноября: 11,
  декабря: 12,
};

const TYPE_RULES: Array<{ type: EventType; words: string[]; title: string }> = [
  {
    type: "talk",
    words: ["лекци", "лектор", "доклад", "выступлени"],
    title: "Лекция",
  },
  {
    type: "ui-circle",
    words: ["ui-кружок", "ui кружок", "уи-круж", "uiкружок"],
    title: "UI-кружок",
  },
  {
    type: "practice",
    words: ["практик", "воркшоп", "разбор практик"],
    title: "Практика",
  },
  {
    type: "discussion",
    words: ["дискусси", "обсуждени"],
    title: "Дискуссия",
  },
  {
    type: "chat",
    words: ["болталк", "ворман", "созвон", "чат"],
    title: "Болталка / Ворман",
  },
  {
    type: "coworking",
    words: ["коворкинг"],
    title: "Онлайн-коворкинг",
  },
  {
    type: "offline",
    words: ["оффлайн", "офлайн", "вживую", "встретимся в", "встреча клуба"],
    title: "Оффлайн-встреча",
  },
  {
    type: "breakfast",
    words: ["завтрак", "брекфаст"],
    title: "Завтрак",
  },
  {
    type: "portfolio",
    words: ["портфолио-ревью", "портфолио ревью", "ревью портфолио"],
    title: "Портфолио-ревью",
  },
];

type ExtractedDate = { date: string; time?: string; matchText: string } | null;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function buildDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function extractDate(
  text: string,
  fallbackDate: Date,
): ExtractedDate {
  const fallbackYear = fallbackDate.getUTCFullYear();
  const fallbackMonth = fallbackDate.getUTCMonth() + 1;

  // Формат "DD месяца [в HH:MM | в HH]"
  const ruRegex =
    /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+в\s+(\d{1,2})(?:[:.](\d{2}))?)?/i;
  const ruMatch = text.match(ruRegex);
  if (ruMatch) {
    const day = Number(ruMatch[1]);
    const monthName = ruMatch[2].toLowerCase();
    const month = MONTHS_RU[monthName];
    const hh = ruMatch[3] ? Number(ruMatch[3]) : undefined;
    const mm = ruMatch[4] ? Number(ruMatch[4]) : 0;
    if (month && day >= 1 && day <= 31) {
      return {
        date: buildDate(fallbackYear, month, day),
        time:
          hh !== undefined ? `${pad(hh)}:${pad(mm)}` : undefined,
        matchText: ruMatch[0],
      };
    }
  }

  // Формат "DD.MM[.YYYY] [в HH:MM]"
  const numRegex =
    /(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?(?:\s+в\s+(\d{1,2})(?:[:.](\d{2}))?)?/;
  const numMatch = text.match(numRegex);
  if (numMatch) {
    const day = Number(numMatch[1]);
    const month = Number(numMatch[2]);
    const yearRaw = numMatch[3];
    const year = yearRaw
      ? yearRaw.length === 2
        ? 2000 + Number(yearRaw)
        : Number(yearRaw)
      : fallbackYear;
    const hh = numMatch[4] ? Number(numMatch[4]) : undefined;
    const mm = numMatch[5] ? Number(numMatch[5]) : 0;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        date: buildDate(year, month, day),
        time:
          hh !== undefined ? `${pad(hh)}:${pad(mm)}` : undefined,
        matchText: numMatch[0],
      };
    }
  }

  // "завтра в HH:MM" / "сегодня в HH:MM"
  const relRegex = /(сегодня|завтра|послезавтра)\s+в\s+(\d{1,2})(?:[:.](\d{2}))?/i;
  const relMatch = text.match(relRegex);
  if (relMatch) {
    const word = relMatch[1].toLowerCase();
    const offset = word === "сегодня" ? 0 : word === "завтра" ? 1 : 2;
    const base = new Date(fallbackDate);
    base.setUTCDate(base.getUTCDate() + offset);
    const hh = Number(relMatch[2]);
    const mm = relMatch[3] ? Number(relMatch[3]) : 0;
    return {
      date: buildDate(
        base.getUTCFullYear(),
        base.getUTCMonth() + 1,
        base.getUTCDate(),
      ),
      time: `${pad(hh)}:${pad(mm)}`,
      matchText: relMatch[0],
    };
  }

  // Просто "в HH:MM" без даты — берём дату сообщения.
  const timeOnly = text.match(/\bв\s+(\d{1,2})[:.](\d{2})\b/);
  if (timeOnly) {
    return {
      date: buildDate(fallbackYear, fallbackMonth, fallbackDate.getUTCDate()),
      time: `${pad(Number(timeOnly[1]))}:${pad(Number(timeOnly[2]))}`,
      matchText: timeOnly[0],
    };
  }

  return null;
}

function detectType(text: string): { type: EventType; title: string } {
  const lower = text.toLowerCase();
  for (const rule of TYPE_RULES) {
    if (rule.words.some((w) => lower.includes(w))) {
      return { type: rule.type, title: rule.title };
    }
  }
  return { type: "other", title: "Событие" };
}

function clipText(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, max - 1).trimEnd() + "…";
}

export type ParseTelegramOptions = {
  monthKey: string; // YYYY-MM — определяет какой месяц мы собираем
};

export function parseTelegramMessages(
  messages: RawTelegramMessage[],
  opts: ParseTelegramOptions,
): MonthlyAutofillDraft {
  const detected: AutoDetectedEvent[] = [];
  const unresolved: RawTelegramMessage[] = [];

  for (const msg of messages) {
    const text = (msg.text ?? msg.caption ?? "").trim();
    if (!text) {
      unresolved.push(msg);
      continue;
    }

    const fallback = new Date(msg.date);
    if (Number.isNaN(fallback.getTime())) {
      unresolved.push(msg);
      continue;
    }

    const dateInfo = extractDate(text, fallback);
    if (!dateInfo) {
      unresolved.push(msg);
      continue;
    }

    if (!dateInfo.date.startsWith(opts.monthKey)) {
      // Сообщение про другой месяц — игнорируем для текущего digest.
      continue;
    }

    const typeInfo = detectType(text);

    let confidence = 0.4;
    if (dateInfo.time) confidence += 0.2;
    if (typeInfo.type !== "other") confidence += 0.2;
    if (text.length > 30) confidence += 0.1;
    if (msg.telegramPostUrl) confidence += 0.1;
    confidence = Math.min(1, confidence);

    detected.push({
      id: nanoid(8),
      confidence,
      status: "draft",
      title: typeInfo.title,
      date: dateInfo.date,
      time: dateInfo.time,
      type: typeInfo.type,
      description: clipText(text),
      imageCandidates: msg.media ?? [],
      selectedImageId: msg.media?.[0]?.id,
      telegramPostUrl: msg.telegramPostUrl,
      sourceMessageIds: [msg.id],
      reasoning: `Сообщение: «${clipText(text, 80)}»`,
    });
  }

  return {
    id: nanoid(8),
    month: opts.monthKey,
    source: "telegram",
    createdAt: new Date().toISOString(),
    status: "draft",
    detectedEvents: detected,
    unresolvedMessages: unresolved,
  };
}
