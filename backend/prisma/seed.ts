/**
 * Заполнение справочника видов игр.
 * Запуск: npx prisma db seed  (из папки backend)
 */

import { PrismaClient } from '@prisma/client';

import { GAME_TITLES } from '@colormemo/shared';

const prisma = new PrismaClient();

const descriptions: Record<string, string> = {
  COLOR_RECALL: 'Запомните цвет и подберите его заново',
  COLOR_CHOICE: 'Запомните цвет и найдите его среди похожих',
  COLOR_SEQUENCE: 'Запомните порядок цветов и повторите его',
};

async function main() {
  for (const [type, title] of Object.entries(GAME_TITLES)) {
    await prisma.game.upsert({
      where: { type: type as never },
      update: { title, description: descriptions[type] },
      create: { type: type as never, title, description: descriptions[type] },
    });
  }
  console.log('Справочник игр заполнен');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
