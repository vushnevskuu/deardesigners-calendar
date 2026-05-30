// Серверный парсер одного TG-сообщения. Это упрощённая копия
// src/lib/chatParser.ts — без зависимости от nanoid и без MonthlyAutofillDraft.
// Возвращает полностью готовое поле для записи в таблицу events.

import type { EventTypeDb } from "./types.js";

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

const TYPE_RULES: Array<{ type: EventTypeDb; words: string[] }> = [
  { type: "talk", words: ["лекци", "лектор", "доклад", "выступлени"] },
  { type: "ui-circle", words: ["ui-кружок", "ui кружок", "уи-круж", "uiкружок"] },
  { type: "practice", words: ["практик", "воркшоп", "разбор практик"] },
  { type: "coworking", words: ["коворкинг"] },
  { type: "discussion", words: ["дискусси", "обсуждени"] },
  { type: "chat", words: ["болталк", "ворман", "созвон"] },
  { type: "offline", words: ["оффлайн", "офлайн", "вживую", "встретимся в", "встреча клуба"] },
  { type: "breakfast", words: ["завтрак", "брекфаст"] },
  { type: "portfolio", words: ["портфолио-ревью", "портфолио ревью", "ревью портфолио"] },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function buildDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

type ExtractedDate = { date: string; time?: string } | null;

function extractDate(text: string, fallback: Date): ExtractedDate {
  const fy = fallback.getUTCFullYear();
  const fm = fallback.getUTCMonth() + 1;

  // "DD месяца [в HH[:MM]]"
  const ru = text.match(
    /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+в\s+(\d{1,2})(?:[:.](\d{2}))?)?/i,
  );
  if (ru) {
    const day = Number(ru[1]);
    const month = MONTHS_RU[ru[2].toLowerCase()];
    const hh = ru[3] ? Number(ru[3]) : undefined;
    const mm = ru[4] ? Number(ru[4]) : 0;
    if (month && day >= 1 && day <= 31) {
      // Если дата уже прошла относительно даты сообщения — это про следующий год.
      let year = fy;
      const candidate = new Date(Date.UTC(year, month - 1, day));
      if (
        candidate.getTime() <
        new Date(Date.UTC(fy, fm - 1, fallback.getUTCDate())).getTime() -
          1000 * 60 * 60 * 24 * 7
      ) {
        year = fy + 1;
      }
      return {
        date: buildDate(year, month, day),
        time: hh !== undefined ? `${pad(hh)}:${pad(mm)}` : undefined,
      };
    }
  }

  // "DD.MM[.YYYY] [в HH[:MM]]"
  const num = text.match(
    /(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?(?:\s+в\s+(\d{1,2})(?:[:.](\d{2}))?)?/,
  );
  if (num) {
    const day = Number(num[1]);
    const month = Number(num[2]);
    const yearRaw = num[3];
    const year = yearRaw
      ? yearRaw.length === 2
        ? 2000 + Number(yearRaw)
        : Number(yearRaw)
      : fy;
    const hh = num[4] ? Number(num[4]) : undefined;
    const mm = num[5] ? Number(num[5]) : 0;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        date: buildDate(year, month, day),
        time: hh !== undefined ? `${pad(hh)}:${pad(mm)}` : undefined,
      };
    }
  }

  // "сегодня/завтра/послезавтра в HH[:MM]"
  const rel = text.match(
    /(сегодня|завтра|послезавтра)\s+в\s+(\d{1,2})(?:[:.](\d{2}))?/i,
  );
  if (rel) {
    const word = rel[1].toLowerCase();
    const offset = word === "сегодня" ? 0 : word === "завтра" ? 1 : 2;
    const base = new Date(fallback);
    base.setUTCDate(base.getUTCDate() + offset);
    const hh = Number(rel[2]);
    const mm = rel[3] ? Number(rel[3]) : 0;
    return {
      date: buildDate(
        base.getUTCFullYear(),
        base.getUTCMonth() + 1,
        base.getUTCDate(),
      ),
      time: `${pad(hh)}:${pad(mm)}`,
    };
  }

  // "в HH:MM" без даты — берём дату поста.
  const t = text.match(/\bв\s+(\d{1,2})[:.](\d{2})\b/);
  if (t) {
    return {
      date: buildDate(fy, fm, fallback.getUTCDate()),
      time: `${pad(Number(t[1]))}:${pad(Number(t[2]))}`,
    };
  }

  return null;
}

function detectType(text: string): EventTypeDb {
  const lower = text.toLowerCase();
  for (const rule of TYPE_RULES) {
    if (rule.words.some((w) => lower.includes(w))) return rule.type;
  }
  return "other";
}

// Заголовок — первая строка / первое предложение, ограничено 90 символами.
function extractTitle(text: string): string {
  const firstLine = text.split(/\r?\n/).map((s) => s.trim()).find(Boolean) ?? "";
  const firstSentence = firstLine.split(/(?<=[.!?])\s/)[0] ?? firstLine;
  const trimmed = firstSentence.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 90) return trimmed || "Событие клуба";
  return trimmed.slice(0, 89).trimEnd() + "…";
}

export type ParsedPost = {
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  title: string;
  description: string;
  type: EventTypeDb;
};

// Превращает текст поста + дату публикации в готовое событие.
// Если даты в тексте нет — берём дату поста (как просил продакт).
export function parsePost(rawText: string, postedAt: Date): ParsedPost {
  const text = rawText.trim();
  const fallbackDate = buildDate(
    postedAt.getUTCFullYear(),
    postedAt.getUTCMonth() + 1,
    postedAt.getUTCDate(),
  );
  const extracted = extractDate(text, postedAt);
  return {
    date: extracted?.date ?? fallbackDate,
    time: extracted?.time,
    title: extractTitle(text || "Событие клуба"),
    description: text || "",
    type: detectType(text),
  };
}
