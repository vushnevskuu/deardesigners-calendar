import { neon, neonConfig } from "@neondatabase/serverless";

// Neon serverless через Vercel Marketplace ставит в env переменные:
//   - DATABASE_URL          (predefined recommended)
//   - POSTGRES_URL          (legacy совместимость, тоже подходит)
// Берём первую найденную.

neonConfig.fetchConnectionCache = true;

export function hasPostgres(): boolean {
  return Boolean(getDatabaseUrl());
}

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

// Один общий tagged-template SQL клиент. neon(url)`...` возвращает Promise<rows>.
// Используется как: const rows = await sql`SELECT ...`;
// Для query c прыгающими параметрами поддерживается template-литерал и
// безопасное экранирование значений.
export function getSql() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("postgres_not_configured");
  }
  return neon(url);
}
