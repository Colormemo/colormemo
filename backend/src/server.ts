import path from 'node:path';

import { createApp } from './app';
import { env } from './env';
import { MemoryRepository } from './games/memory.repository';
import type { AppRepository } from './games/repository';

async function buildRepository(): Promise<AppRepository> {
  if (env.useMemoryDb) {
    console.log(`Режим без базы: данные лежат в ${env.dataFile}`);
    return new MemoryRepository({ filePath: env.dataFile });
  }

  // Prisma подключается только когда действительно нужна, поэтому режим
  // без базы работает даже до первого `prisma generate`.
  const { PrismaClient } = await import('@prisma/client');
  const { PrismaRepository } = await import('./games/prisma.repository');

  const prisma = new PrismaClient();
  await prisma.$connect();

  const stop = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  return new PrismaRepository(prisma);
}

async function main() {
  const repo = await buildRepository();

  // Папка с собранным фронтом: в образе Docker она лежит рядом с dist.
  const clientDir = env.clientDir || path.resolve(__dirname, '../public');

  const app = createApp({ repo, clientDir });

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`Сервер поднят: http://localhost:${env.port}`);
    console.log(`Проверка: http://localhost:${env.port}/api/health`);
  });
}

main().catch((error) => {
  console.error('Не удалось запустить сервер:', error);
  process.exit(1);
});
