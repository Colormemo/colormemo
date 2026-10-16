/**
 * Все параметры баланса игр собраны здесь.
 *
 * Зачем отдельный файл: после тестирования на людях цифры почти наверняка
 * придётся крутить. Когда они лежат в одном месте, правка занимает минуту
 * и не требует лазить по игровой логике. В лабе 2 на это можно ссылаться
 * как на снижение риска «задания оказались слишком сложными/простыми».
 */

import type { Difficulty, GameType } from './games';

/** «Повтори цвет» */
export interface RecallParams {
  /** время показа цвета, мс */
  showTimeMs: number;
  /** ниже этой точности (%) ответ считается неудачным */
  passAccuracy: number;
}

/** «Выбери цвет» */
export interface ChoiceParams {
  showTimeMs: number;
  /** сколько вариантов предложить */
  optionCount: number;
  /**
   * Насколько варианты похожи на исходный цвет, в единицах Delta E.
   * Чем меньше число, тем ближе отвлекающие цвета и тем сложнее выбор.
   * Ориентир: 10 — разница очевидна, 3 — надо присматриваться, 1.5 — очень трудно.
   */
  distractorDeltaE: number;
}

/** «Воспроизведи последовательность» */
export interface SequenceParams {
  /** время показа одного цвета, мс */
  showTimeMs: number;
  /** длина последовательности */
  length: number;
  /** минимальное различие между цветами внутри последовательности, Delta E */
  minDeltaE: number;
}

export const RECALL_LEVELS: Record<Difficulty, RecallParams> = {
  1: { showTimeMs: 3000, passAccuracy: 60 },
  2: { showTimeMs: 2000, passAccuracy: 70 },
  3: { showTimeMs: 1200, passAccuracy: 75 },
  4: { showTimeMs: 800, passAccuracy: 80 },
  5: { showTimeMs: 500, passAccuracy: 85 },
};

export const CHOICE_LEVELS: Record<Difficulty, ChoiceParams> = {
  1: { showTimeMs: 3000, optionCount: 4, distractorDeltaE: 14 },
  2: { showTimeMs: 2000, optionCount: 4, distractorDeltaE: 9 },
  3: { showTimeMs: 1500, optionCount: 6, distractorDeltaE: 6 },
  4: { showTimeMs: 1000, optionCount: 8, distractorDeltaE: 4 },
  5: { showTimeMs: 700, optionCount: 9, distractorDeltaE: 2.5 },
};

export const SEQUENCE_LEVELS: Record<Difficulty, SequenceParams> = {
  1: { showTimeMs: 900, length: 3, minDeltaE: 25 },
  2: { showTimeMs: 700, length: 4, minDeltaE: 20 },
  3: { showTimeMs: 600, length: 5, minDeltaE: 15 },
  4: { showTimeMs: 450, length: 6, minDeltaE: 12 },
  5: { showTimeMs: 350, length: 7, minDeltaE: 10 },
};

/** Максимальный уровень сложности, доступный игроку. План-минимум — 2. */
export const MAX_DIFFICULTY: Difficulty = 2;

/**
 * Базовые очки за идеально выполненное задание.
 * Итог = base * (accuracy / 100) * множитель сложности.
 */
export const SCORE_BASE: Record<GameType, number> = {
  COLOR_RECALL: 100,
  COLOR_CHOICE: 80,
  COLOR_SEQUENCE: 120,
};

/** Множитель за сложность: играть на высоком уровне выгоднее. */
export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  1: 1,
  2: 1.3,
  3: 1.6,
  4: 2,
  5: 2.5,
};
