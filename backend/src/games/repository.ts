/**
 * Хранилище — описано интерфейсами, а не привязано к базе.
 *
 * Зачем так. Игровая логика не должна знать, куда именно пишутся данные.
 * Благодаря этому:
 *   - игровую логику и все ручки API можно протестировать без Postgres
 *     (в тестах подставляется реализация в памяти);
 *   - приложение запускается и работает до поднятия базы:
 *     `npm run dev:nodb` держит данные в файле рядом с проектом;
 *   - при правках схемы меняется только prisma.repository.ts.
 *
 * Интерфейсы разделены по смыслу (задания, пользователи, статистика),
 * а реализации собирают их вместе в AppRepository.
 */

import type { Difficulty, GameType } from '@colormemo/shared';

// --- Задания и результаты --------------------------------------------------

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

// --- Пользователи ----------------------------------------------------------

export interface UserRecord {
  id: string;
  login: string;
  /** Результат scrypt, а не пароль. Наружу не отдаётся никогда. */
  passwordHash: string;
  createdAt: Date;
}

export interface UserRepository {
  createUser(login: string, passwordHash: string): Promise<UserRecord>;
  /**
   * Поиск по логину. Регистр не учитывается: иначе «Masha» и «masha»
   * станут разными аккаунтами, а человек будет считать, что пароль забыл.
   */
  findUserByLogin(login: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
}

// --- Статистика и история --------------------------------------------------

/** Одна отвеченная попытка — строка для истории и для подсчёта агрегатов. */
export interface AttemptRow {
  id: string;
  gameType: GameType;
  difficulty: Difficulty;
  accuracy: number;
  score: number;
  responseTimeMs: number;
  playedAt: Date;
}

export interface StatsRepository {
  /**
   * Все отвеченные попытки игрока, новые сначала.
   * Агрегаты считаются из них на стороне сервиса, а не запросом в базе:
   * объём данных одного игрока маленький, зато формула одна и та же
   * для Postgres и для режима без базы — расходиться им негде.
   */
  attempts(userId: string, limit?: number): Promise<AttemptRow[]>;
}

/** Всё хранилище целиком: именно это получает приложение. */
export interface AppRepository extends TaskRepository, UserRepository, StatsRepository {}
