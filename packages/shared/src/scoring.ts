/**
 * Подсчёт точности и очков. Живёт в общем пакете, потому что:
 *   - сервер считает этим итоговый результат, который пишется в базу;
 *   - клиент этим же показывает предварительную оценку на экране разбора.
 * Одна формула на двоих — расхождений быть не может.
 */

import { colorAccuracy, normalizeHex } from './color';
import { DIFFICULTY_MULTIPLIER, SCORE_BASE } from './difficulty';
import type { Difficulty, GameAnswer, GameTask, GameType, Hex } from './games';

export interface Scored {
  /** точность в процентах, 0–100 */
  accuracy: number;
  /** начисленные очки */
  score: number;
}

/** Очки из точности: база игры × доля точности × множитель сложности. */
export function scoreFromAccuracy(
  gameType: GameType,
  difficulty: Difficulty,
  accuracy: number,
): number {
  const raw = SCORE_BASE[gameType] * (accuracy / 100) * DIFFICULTY_MULTIPLIER[difficulty];
  return Math.round(raw);
}

/**
 * Точность в «Воспроизведи последовательность».
 *
 * Считаем долю цветов, оказавшихся на своём месте. Частичный зачёт нужен,
 * чтобы игрок, перепутавший два цвета из шести, не получал ноль — иначе
 * играть обидно и мотивация падает.
 */
export function sequenceAccuracy(correct: readonly Hex[], given: readonly Hex[]): number {
  if (correct.length === 0) return 0;

  const normalizedCorrect = correct.map(normalizeHex);
  const normalizedGiven = given.map(normalizeHex);

  let hits = 0;
  for (let i = 0; i < normalizedCorrect.length; i += 1) {
    if (normalizedGiven[i] === normalizedCorrect[i]) hits += 1;
  }

  return Math.round((hits / normalizedCorrect.length) * 1000) / 10;
}

/**
 * Проверка ответа. Вызывается на сервере: он знает задание, получает ответ
 * клиента и возвращает точность с очками.
 */
export function scoreAnswer(task: GameTask, answer: GameAnswer): Scored {
  if (task.gameType !== answer.gameType) {
    throw new Error(
      `Тип игры в задании (${task.gameType}) не совпадает с ответом (${answer.gameType})`,
    );
  }

  let accuracy: number;

  switch (task.gameType) {
    case 'COLOR_RECALL': {
      const given = answer as { pickedColor: Hex };
      accuracy = colorAccuracy(task.targetColor, given.pickedColor);
      break;
    }
    case 'COLOR_CHOICE': {
      const given = answer as { pickedColor: Hex };
      // здесь только «попал / не попал»: вариант либо тот самый, либо нет
      accuracy = normalizeHex(given.pickedColor) === normalizeHex(task.targetColor) ? 100 : 0;
      break;
    }
    case 'COLOR_SEQUENCE': {
      const given = answer as { pickedSequence: Hex[] };
      accuracy = sequenceAccuracy(task.sequence, given.pickedSequence);
      break;
    }
  }

  return {
    accuracy,
    score: scoreFromAccuracy(task.gameType, task.difficulty, accuracy),
  };
}
