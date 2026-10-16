/**
 * Заглушка API. Реализует тот же контракт, что и настоящий бэк,
 * но живёт целиком в браузере.
 *
 * Зачем: игровую логику можно писать и проверять, не дожидаясь, пока Настя
 * поднимет сервер. Когда API будет готов, в .env.local ставим
 * VITE_USE_MOCK=false — и ни одна строка игрового кода не меняется.
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

/** Выданные задания храним в памяти страницы, как это делал бы сервер. */
const issuedTasks = new Map<string, GameTask>();
const bestScores = new Map<string, number>();

let counter = 0;
const nextId = () => `mock-${(counter += 1)}`;

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function mockStartTask(gameType: GameType, difficulty: Difficulty): Promise<GameTask> {
  const attemptId = nextId();
  let task: GameTask;

  switch (gameType) {
    case 'COLOR_RECALL': {
      const level = RECALL_LEVELS[difficulty];
      task = {
        attemptId,
        gameType,
        difficulty,
        showTimeMs: level.showTimeMs,
        targetColor: randomTargetColor(),
      };
      break;
    }
    case 'COLOR_CHOICE': {
      const level = CHOICE_LEVELS[difficulty];
      const targetColor = randomTargetColor();
      task = {
        attemptId,
        gameType,
        difficulty,
        showTimeMs: level.showTimeMs,
        targetColor,
        options: makeChoiceOptions(targetColor, level.optionCount, level.distractorDeltaE),
      };
      break;
    }
    case 'COLOR_SEQUENCE': {
      const level = SEQUENCE_LEVELS[difficulty];
      task = {
        attemptId,
        gameType,
        difficulty,
        showTimeMs: level.showTimeMs,
        sequence: makeSequence(level.length, level.minDeltaE),
      };
      break;
    }
  }

  issuedTasks.set(attemptId, task);
  return delay(task);
}

export function mockSubmitAnswer(answer: GameAnswer): Promise<GameResult> {
  const task = issuedTasks.get(answer.attemptId);
  if (!task) throw new Error('Задание не найдено — заглушка не выдавала такой id');

  const { accuracy, score } = scoreAnswer(task, answer);

  const key = `${task.gameType}:${task.difficulty}`;
  const previousBest = bestScores.get(key) ?? -1;
  const isRecord = score > previousBest;
  if (isRecord) bestScores.set(key, score);

  const result: GameResult = {
    attemptId: task.attemptId,
    gameType: task.gameType,
    difficulty: task.difficulty,
    accuracy,
    score,
    correct: {
      color: 'targetColor' in task ? task.targetColor : undefined,
      sequence: 'sequence' in task ? task.sequence : undefined,
    },
    given: {
      color: 'pickedColor' in answer ? (answer.pickedColor as Hex) : undefined,
      sequence: 'pickedSequence' in answer ? (answer.pickedSequence as Hex[]) : undefined,
    },
    isRecord,
  };

  return delay(result);
}
