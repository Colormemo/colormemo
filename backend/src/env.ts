import path from 'node:path';

import 'dotenv/config';

/**
 * Настройки сервера в одном месте.
 *
 * CORS тут нет намеренно: фронт и API живут на одном домене, браузер считает
 * запросы своими, и разрешать ничего не нужно. Это же избавляет от возни
 * с межсайтовыми cookie — токен сессии ставится с sameSite lax.
 */

const DEFAULT_SECRET = 'dev-secret-change-me';

const authSecret = process.env.AUTH_SECRET ?? process.env.JWT_SECRET ?? DEFAULT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

/*
 * Запускать готовое приложение с секретом из примера нельзя: подписанный им
 * токен подделает кто угодно, кто видел репозиторий. В разработке это
 * удобно, поэтому падаем только в production.
 */
if (isProduction && authSecret === DEFAULT_SECRET) {
  throw new Error(
    "AUTH_SECRET не задан. Сгенерируйте секрет: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
  );
}

export const env = {
  port: Number(process.env.PORT ?? 3000),

  databaseUrl: process.env.DATABASE_URL ?? '',

  /** Секрет для подписи токенов сессии. */
  authSecret,

  /**
   * Работать без базы: пользователи, задания и результаты хранятся в файле.
   * Нужно, чтобы приложение целиком работало там, где Postgres не поднят.
   */
  useMemoryDb: process.env.USE_MEMORY_DB === 'true',

  /** Куда писать данные в режиме без базы. */
  dataFile: process.env.DATA_FILE ?? path.resolve(process.cwd(), '.data/colormemo.json'),

  /**
   * Папка с собранным фронтом. Если её нет, сервер работает как чистое API —
   * так и происходит в разработке, где фронт поднимает Vite на своём порту.
   */
  clientDir: process.env.CLIENT_DIR ?? '',

  isProduction,
} as const;
