/**
 * Общие типы игр. Используются и фронтом, и бэком — описываем один раз.
 *
 * Правило разделения ответственности:
 *   сервер  — генерирует задание, хранит его и САМ считает очки;
 *   клиент  — показывает задание, ведёт таймер, отправляет ответ пользователя.
 *
 * Клиент неизбежно видит правильный ответ (он же обязан показать цвет),
 * поэтому подделать сам ответ теоретически можно. Важно другое: клиент не
 * присылает итоговый балл, его считает сервер. Для учебного проекта этого
 * достаточно, а в риски лабы 2 стоит записать: «результаты уязвимы к правке
 * через консоль браузера, устраняется серверной генерацией и проверкой».
 */

/** Виды игр. Первые три — план-минимум из лабораторной 1. */
export const GAME_TYPES = ['COLOR_RECALL', 'COLOR_CHOICE', 'COLOR_SEQUENCE'] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const GAME_TITLES: Record<GameType, string> = {
  COLOR_RECALL: 'Повтори цвет',
  COLOR_CHOICE: 'Выбери цвет',
  COLOR_SEQUENCE: 'Воспроизведи последовательность',
};

/** Уровень сложности. В плане-минимум используем 1 и 2, в максимуме — до 5. */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Цвет всегда передаём строкой '#rrggbb' в нижнем регистре. */
export type Hex = string;

// --------------------------------------------------------------------------
// Задание: то, что сервер отдаёт клиенту
// --------------------------------------------------------------------------

interface TaskBase {
  /** id попытки в БД, его же клиент вернёт вместе с ответом */
  attemptId: string;
  gameType: GameType;
  difficulty: Difficulty;
  /** сколько миллисекунд показывать цвет до скрытия */
  showTimeMs: number;
}

/** «Повтори цвет»: показали цвет, пользователь подбирает его пипеткой. */
export interface ColorRecallTask extends TaskBase {
  gameType: 'COLOR_RECALL';
  targetColor: Hex;
}

/** «Выбери цвет»: показали цвет, пользователь выбирает его из вариантов. */
export interface ColorChoiceTask extends TaskBase {
  gameType: 'COLOR_CHOICE';
  targetColor: Hex;
  /** варианты в случайном порядке, один из них равен targetColor */
  options: Hex[];
}

/** «Воспроизведи последовательность»: показали цвета по порядку. */
export interface ColorSequenceTask extends TaskBase {
  gameType: 'COLOR_SEQUENCE';
  sequence: Hex[];
}

export type GameTask = ColorRecallTask | ColorChoiceTask | ColorSequenceTask;

// --------------------------------------------------------------------------
// Ответ: то, что клиент отправляет серверу
// --------------------------------------------------------------------------

interface AnswerBase {
  attemptId: string;
  /** сколько миллисекунд пользователь думал над ответом */
  responseTimeMs: number;
}

export interface ColorRecallAnswer extends AnswerBase {
  gameType: 'COLOR_RECALL';
  pickedColor: Hex;
}

export interface ColorChoiceAnswer extends AnswerBase {
  gameType: 'COLOR_CHOICE';
  pickedColor: Hex;
}

export interface ColorSequenceAnswer extends AnswerBase {
  gameType: 'COLOR_SEQUENCE';
  /** последовательность в том порядке, в котором её собрал пользователь */
  pickedSequence: Hex[];
}

export type GameAnswer = ColorRecallAnswer | ColorChoiceAnswer | ColorSequenceAnswer;

// --------------------------------------------------------------------------
// Результат: то, что сервер возвращает после проверки
// --------------------------------------------------------------------------

export interface GameResult {
  attemptId: string;
  gameType: GameType;
  difficulty: Difficulty;
  /** точность в процентах, 0–100 */
  accuracy: number;
  /** начисленные очки */
  score: number;
  /** правильный ответ — показываем на экране разбора */
  correct: {
    color?: Hex;
    sequence?: Hex[];
  };
  /** что выбрал пользователь — для сравнения «было / стало» */
  given: {
    color?: Hex;
    sequence?: Hex[];
  };
  /** true, если это личный рекорд пользователя в этой игре и сложности */
  isRecord: boolean;
}
