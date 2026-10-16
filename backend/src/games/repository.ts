/**
 * Хранилище заданий и результатов — описано интерфейсом, а не привязано к базе.
 *
 * Зачем так. Игровая логика не должна знать, куда именно пишутся данные.
 * Благодаря этому:
 *   - игровую логику и все ручки API можно протестировать без Postgres
 *     (в тестах подставляется реализация в памяти);
 *   - я могу писать и запускать бэк, пока Настя ещё делает схему базы:
 *     `npm run dev:nodb` поднимает сервер без базы вообще;
 *   - при правках схемы меняется только один файл prisma.repository.ts.
 */

import type { Difficulty, GameType } from '@colormemo/shared';

/** Запись о выданном задании — то, что сервер обязан помнить до ответа игрока. */
export interface StoredTask {
  id: string;
  gameType: GameType;
  difficulty: Difficulty;
  showTimeMs: number;
  /** Параметры задания: целевой цвет, варианты, последовательность. */
  payload: Record<string, unknown>;
  userId: string | null;
  /** true, если на задание уже ответили: повторно отвечать нельзя. */
  answered: boolean;
}

export interface SaveResultInput {
  taskId: string;
  accuracy: number;
  score: number;
  responseTimeMs: number;
  answer: Record<string, unknown>;
}

export interface TaskRepository {
  createTask(task: Omit<StoredTask, 'id' | 'answered'>): Promise<StoredTask>;
  findTask(id: string): Promise<StoredTask | null>;
  saveResult(input: SaveResultInput): Promise<void>;
  /** Лучший результат игрока в этой игре и сложности, кроме указанного задания. */
  bestScore(
    userId: string,
    gameType: GameType,
    difficulty: Difficulty,
    exceptTaskId: string,
  ): Promise<number | null>;
}
