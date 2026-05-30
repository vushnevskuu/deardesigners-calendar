import { sql } from "@vercel/postgres";

// Проверка что Postgres подключён. Если переменной нет — фронт получит 503,
// и фронтовый storage сам откатится на demo-данные. Это позволяет работать
// на Vercel ещё до подключения Marketplace-интеграции БД.
export function hasPostgres(): boolean {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING,
  );
}

// Один общий объект клиента — sql<T> проверяет что POSTGRES_URL задан, и
// поднимает ошибку с понятным текстом, если нет.
export { sql };
