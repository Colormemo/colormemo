/**
 * Хранилище в PostgreSQL через Prisma. Единственный файл, который знает про базу.
 */

import type { PrismaClient } from '@prisma/client';

import type { Difficulty, GameType } from '@colormemo/shared';

import type {
  AppRepository,
  AttemptRow,
  SaveResultInput,
  StoredTask,
  UserRecord,
} from './repository';

export class PrismaRepository implements AppRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // --- Задания -------------------------------------------------------------

  async createTask(task: Omit<StoredTask, 'id' | 'answered'>): Promise<StoredTask> {
    const created = await this.prisma.gameTask.create({
      data: {
        gameType: task.gameType,
        difficulty: task.difficulty,
        showTimeMs: task.showTimeMs,
        payload: task.payload as object,
        userId: task.userId,
      },
    });

    return {
      id: created.id,
      gameType: created.gameType as GameType,
      difficulty: created.difficulty as Difficulty,
      showTimeMs: created.showTimeMs,
      payload: created.payload as Record<string, unknown>,
      userId: created.userId,
      answered: false,
    };
  }

  async findTask(id: string): Promise<StoredTask | null> {
    const task = await this.prisma.gameTask.findUnique({
      where: { id },
      include: { result: { select: { id: true } } },
    });

    if (!task) return null;

    return {
      id: task.id,
      gameType: task.gameType as GameType,
      difficulty: task.difficulty as Difficulty,
      showTimeMs: task.showTimeMs,
      payload: task.payload as Record<string, unknown>,
      userId: task.userId,
      answered: task.result !== null,
    };
  }

  async saveResult(input: SaveResultInput): Promise<void> {
    await this.prisma.result.create({
      data: {
        taskId: input.taskId,
        accuracy: input.accuracy,
        score: input.score,
        responseTimeMs: input.responseTimeMs,
        answer: input.answer as object,
      },
    });
  }

  async bestScore(
    userId: string,
    gameType: GameType,
    difficulty: Difficulty,
    exceptTaskId: string,
  ): Promise<number | null> {
    const best = await this.prisma.result.findFirst({
      where: {
        task: { userId, gameType, difficulty },
        NOT: { taskId: exceptTaskId },
      },
      orderBy: { score: 'desc' },
      select: { score: true },
    });

    return best?.score ?? null;
  }

  // --- Пользователи --------------------------------------------------------

  async createUser(login: string, passwordHash: string): Promise<UserRecord> {
    const created = await this.prisma.user.create({ data: { login, passwordHash } });
    return created;
  }

  async findUserByLogin(login: string): Promise<UserRecord | null> {
    // mode: 'insensitive' — чтобы «Masha» и «masha» считались одним логином.
    return this.prisma.user.findFirst({
      where: { login: { equals: login, mode: 'insensitive' } },
    });
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // --- Статистика ----------------------------------------------------------

  async attempts(userId: string, limit?: number): Promise<AttemptRow[]> {
    const rows = await this.prisma.result.findMany({
      where: { task: { userId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        accuracy: true,
        score: true,
        responseTimeMs: true,
        createdAt: true,
        task: { select: { gameType: true, difficulty: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      gameType: row.task.gameType as GameType,
      difficulty: row.task.difficulty as Difficulty,
      accuracy: row.accuracy,
      score: row.score,
      responseTimeMs: row.responseTimeMs,
      playedAt: row.createdAt,
    }));
  }
}
