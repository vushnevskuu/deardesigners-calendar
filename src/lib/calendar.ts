import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const WEEKDAYS_RU_SHORT = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

export const MONTHS_RU_NOM = [
  "ЯНВАРЬ",
  "ФЕВРАЛЬ",
  "МАРТ",
  "АПРЕЛЬ",
  "МАЙ",
  "ИЮНЬ",
  "ИЮЛЬ",
  "АВГУСТ",
  "СЕНТЯБРЬ",
  "ОКТЯБРЬ",
  "НОЯБРЬ",
  "ДЕКАБРЬ",
];

export function parseMonthKey(monthKey: string): Date {
  // monthKey: YYYY-MM
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1);
}

export function formatMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftMonth(monthKey: string, delta: number): string {
  const next = addMonths(parseMonthKey(monthKey), delta);
  return formatMonthKey(next);
}

export function monthTitleRu(monthKey: string): string {
  const d = parseMonthKey(monthKey);
  return `${MONTHS_RU_NOM[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthTitleShort(monthKey: string): string {
  const d = parseMonthKey(monthKey);
  return MONTHS_RU_NOM[d.getMonth()] ?? "";
}

export type GridCell = {
  date: Date;
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
};

export function buildMonthGrid(monthKey: string, today: Date = new Date()): GridCell[] {
  const monthDate = parseMonthKey(monthKey);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  // weekStartsOn: 1 = Monday
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const cells: GridCell[] = [];
  const cur = new Date(gridStart);
  const todayIso = formatISODate(today);
  while (cur <= gridEnd) {
    const iso = formatISODate(cur);
    cells.push({
      date: new Date(cur),
      iso,
      day: cur.getDate(),
      inMonth: cur.getMonth() === monthDate.getMonth(),
      isToday: iso === todayIso,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

export function isDateInMonth(iso: string, monthKey: string): boolean {
  return iso.startsWith(monthKey);
}

export function isoIsPast(iso: string, today: Date = new Date()): boolean {
  const d = parseISO(iso);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return d.getTime() < t.getTime();
}

export function formatHumanDate(iso: string): string {
  const d = parseISO(iso);
  return format(d, "d MMMM");
}

export function dayNumberRu(iso: string): string {
  const d = parseISO(iso);
  return String(d.getDate());
}
