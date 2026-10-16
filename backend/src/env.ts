import 'dotenv/config';

/**
 * Настройки сервера в одном месте.
 *
 * CORS тут нет намеренно: фронт и API живут на одном домене, браузер считает
 * запросы своими, и разрешать ничего не нужно. Это же избавляет от возни
 * с межсайтовыми cookie — токен авторизации ставится с sameSite lax.
 */
export const env = {
  port: Number(process.env.PORT ?? 3000),

  databaseUrl: process.env.DATABASE_URL ?? '',

  /** Секрет для подписи токенов авторизации (понадобится Насте). */
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',

  /**
   * Работать без базы, храня задания в памяти процесса.
   * Нужно, чтобы писать и проверять игровую логику до готовой схемы базы.
   */
  useMemoryDb: process.env.USE_MEMORY_DB === 'true',

  /**
   * Папка с собранным фронтом. Если её нет, сервер работает как чистое API —
   * так и происходит в разработке, где фронт поднимает Vite на своём порту.
   */
  clientDir: process.env.CLIENT_DIR ?? '',

  isProduction: process.env.NODE_ENV === 'production',
} as const;
