/**
 * Игровая логика сервера: выдать задание и проверить ответ.
 * Про базу и про Express не знает ничего — поэтому и тестируется отдельно.
 */

import {
  CHOICE_LEVELS,
  RECALL_LEVELS,
  SEQUENCE_LEVELS,
  makeChoiceOptions,
  makeSequence,
  randomTargetColor,
  scoreAnswer,
  type Difficulty,
  type GameAnswer,
  type GameResult,
  type GameTask,
  type GameType,
  type Hex,
} from '@colormemo/shared';

import type { StoredTask, TaskRepository } from './repository';

/** Ошибка, которую слой Express переводит в нужный код ответа. */
export class GameError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface SubmitInput {
  taskId: string;
  responseTimeMs: number;
  pickedColor?: string;
  pickedSequence?: string[];
}

export class GamesService {
  constructor(private readonly repo: TaskRepository) {}

  /** Новое задание: параметры выбирает сервер, клиент их не присылает. */
  async createTask(
    gameType: GameType,
    difficulty: Difficulty,
    userId: string | null,
  ): Promise<GameTask> {
    const { payload, showTimeMs } = generatePayload(gameType, difficulty);

    const stored = await this.repo.createTask({
      gameType,
      difficulty,
      showTimeMs,
      payload,
      userId,
    });

    return toGameTask(stored);
  }

  /** Проверка ответа: считаем точность и очки по сохранённому заданию. */
  async submitAnswer(input: SubmitInput, userId: string | null): Promise<GameResult> {
    const stored = await this.repo.findTask(input.taskId);

    if (!stored) throw new GameError('Задание не найдено', 404);
    if (stored.answered) throw new GameError('На это задание уже отвечали', 409);
    if (stored.userId !== null && stored.userId !== userId) {
      throw new GameError('Задание принадлежит другому игроку', 403);
    }

    const task = toGameTask(stored);
    const answer = buildAnswer(task.gameType, input);
    const { accuracy, score } = scoreAnswer(task, answer);

    await this.repo.saveResult({
      taskId: stored.id,
      accuracy,
      score,
      responseTimeMs: input.responseTimeMs,
      answer: answer as unknown as Record<string, unknown>,
    });

    const isRecord = userId ? await this.isRecord(userId, task, score) : false;

    return {
      attemptId: stored.id,
      gameType: task.gameType,
      difficulty: task.difficulty,
      accuracy,
      score,
      correct: {
        color: 'targetColor' in task ? task.targetColor : undefined,
        sequence: 'sequence' in task ? task.sequence : undefined,
      },
      given: {
        color: input.pickedColor as Hex | undefined,
        sequence: input.pickedSequence as Hex[] | undefined,
      },
      isRecord,
    };
  }

  private async isRecord(userId: string, task: GameTask, score: number): Promise<boolean> {
    const best = await this.repo.bestScore(userId, task.gameType, task.difficulty, task.attemptId);
    return best === null || score > best;
  }
}

function toGameTask(stored: StoredTask): GameTask {
  return {
    attemptId: stored.id,
    gameType: stored.gameType,
    difficulty: stored.difficulty,
    showTimeMs: stored.showTimeMs,
    ...stored.payload,
  } as GameTask;
}

function generatePayload(gameType: GameType, difficulty: Difficulty) {
  switch (gameType) {
    case 'COLOR_RECALL': {
      const level = RECALL_LEVELS[difficulty];
      return {
        showTimeMs: level.showTimeMs,
        payload: { targetColor: randomTargetColor() } as Record<string, unknown>,
      };
    }
    case 'COLOR_CHOICE': {
      const level = CHOICE_LEVELS[difficulty];
      const targetColor = randomTargetColor();
      return {
        showTimeMs: level.showTimeMs,
        payload: {
          targetColor,
          options: makeChoiceOptions(targetColor, level.optionCount, level.distractorDeltaE),
        } as Record<string, unknown>,
      };
    }
    case 'COLOR_SEQUENCE': {
      const level = SEQUENCE_LEVELS[difficulty];
      return {
        showTimeMs: level.showTimeMs,
        payload: {
          sequence: makeSequence(level.length, level.minDeltaE),
        } as Record<string, unknown>,
      };
    }
  }
}

function buildAnswer(gameType: GameType, input: SubmitInput): GameAnswer {
  const base = { attemptId: input.taskId, responseTimeMs: input.responseTimeMs };

  if (gameType === 'COLOR_SEQUENCE') {
    if (!input.pickedSequence) {
      throw new GameError('Для этой игры нужно передать pickedSequence', 400);
    }
    return { ...base, gameType, pickedSequence: input.pickedSequence as Hex[] };
  }

  if (!input.pickedColor) {
    throw new GameError('Для этой игры нужно передать pickedColor', 400);
  }
  return { ...base, gameType, pickedColor: input.pickedColor as Hex };
}
