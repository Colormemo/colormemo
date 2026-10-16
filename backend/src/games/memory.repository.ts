/**
 * Хранилище в памяти процесса. Используется в тестах и в режиме `npm run dev:nodb`.
 * Данные живут до перезапуска сервера — для разработки и тестов этого достаточно.
 */

import { randomUUID } from 'node:crypto';

import type { Difficulty, GameType } from '@colormemo/shared';

import type { SaveResultInput, StoredTask, TaskRepository } from './repository';

export class MemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, StoredTask>();
  private results = new Map<string, SaveResultInput>();

  async createTask(task: Omit<StoredTask, 'id' | 'answered'>): Promise<StoredTask> {
    const stored: StoredTask = { ...task, id: randomUUID(), answered: false };
    this.tasks.set(stored.id, stored);
    return stored;
  }

  async findTask(id: string): Promise<StoredTask | null> {
    return this.tasks.get(id) ?? null;
  }

  async saveResult(input: SaveResultInput): Promise<void> {
    const task = this.tasks.get(input.taskId);
    if (task) task.answered = true;
    this.results.set(input.taskId, input);
  }

  async bestScore(
    userId: string,
    gameType: GameType,
    difficulty: Difficulty,
    exceptTaskId: string,
  ): Promise<number | null> {
    let best: number | null = null;

    for (const [taskId, result] of this.results) {
      if (taskId === exceptTaskId) continue;

      const task = this.tasks.get(taskId);
      if (!task) continue;
      if (task.userId !== userId) continue;
      if (task.gameType !== gameType || task.difficulty !== difficulty) continue;

      if (best === null || result.score > best) best = result.score;
    }

    return best;
  }
}
