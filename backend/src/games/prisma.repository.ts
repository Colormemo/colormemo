/**
 * Хранилище в PostgreSQL через Prisma. Единственный файл, который знает про базу.
 */

import type { PrismaClient } from '@prisma/client';

import type { Difficulty, GameType } from '@colormemo/shared';

import type { SaveResultInput, StoredTask, TaskRepository } from './repository';

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
}
