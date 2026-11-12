/**
 * Общий игровой цикл. Задача 34 по лабе 4.
 *
 * Один и тот же порядок действий у всех игр: запросили задание — показали
 * его на время — спрятали — приняли ответ — показали разбор — следующий
 * раунд, и так пять раз, а в конце итоги серии. Различается только то,
 * чем именно человек отвечает: пипеткой, выбором из вариантов или порядком
 * цветов. Поэтому цикл живёт здесь, а экраны игр отвечают лишь за свою
 * часть разметки.
 *
 * Почему серия, а не одно задание: по одному раунду нельзя судить о памяти —
 * в «Выбери цвет» с четырьмя вариантами случайное попадание даёт 25%.
 * Пять раундов уже дают осмысленную среднюю точность, и именно её человек
 * видит в итогах и в статистике.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ROUNDS_PER_SESSION,
  type Difficulty,
  type GameResult,
  type GameTask,
  type GameType,
  type Hex,
} from '@colormemo/shared';

import { startTask, submitAnswer } from '../../api';

export type Phase =
  /** до начала серии */
  | 'idle'
  /** ждём ответа сервера */
  | 'loading'
  /** задание на экране, идёт отсчёт */
  | 'showing'
  /** задание спрятано, человек отвечает */
  | 'answering'
  /** разбор прошедшего раунда */
  | 'result'
  /** серия закончена, показываем итоги */
  | 'finished';

/** Чем ответил игрок. Поля разные у разных игр, заполняется одно из них. */
export interface AnswerPayload {
  pickedColor?: Hex;
  pickedSequence?: Hex[];
}

export interface GameSession {
  phase: Phase;
  /** Задание текущего раунда. null вне раунда. */
  task: GameTask | null;
  /** Сколько миллисекунд осталось показывать задание. */
  msLeft: number;
  /** Номер текущего раунда, считая с единицы. */
  round: number;
  totalRounds: number;
  /** Разбор последнего раунда. */
  lastResult: GameResult | null;
  /** Результаты всех сыгранных раундов серии. */
  results: GameResult[];
  totalScore: number;
  averageAccuracy: number;
  error: string | null;

  start(): void;
  answer(payload: AnswerPayload): void;
  next(): void;
  /** Начать серию заново с первого раунда. */
  restart(): void;
}

export function useGameSession(gameType: GameType, difficulty: Difficulty): GameSession {
  const [phase, setPhase] = useState<Phase>('idle');
  const [task, setTask] = useState<GameTask | null>(null);
  const [msLeft, setMsLeft] = useState(0);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Момент, когда задание спряталось. Отсчитываем от него время ответа.
   * performance.now() устойчивее Date.now(): не сбивается, если у игрока
   * подвинулись системные часы.
   */
  const answerStartedAt = useRef(0);
  const timers = useRef<number[]>([]);

  /** Задание текущего раунда — для отправки ответа без гонки с состоянием. */
  const currentTask = useRef<GameTask | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.forEach((id) => window.clearInterval(id));
    timers.current = [];
  }, []);

  // Уходя со страницы, гасим отсчёт: иначе таймер попробует обновить
  // состояние снятого с экрана компонента.
  useEffect(() => clearTimers, [clearTimers]);

  /** Запрашивает задание и проводит показ с отсчётом. */
  const beginRound = useCallback(async () => {
    clearTimers();
    setError(null);
    setLastResult(null);
    setPhase('loading');

    try {
      const received = await startTask(gameType, difficulty);

      currentTask.current = received;
      setTask(received);
      setMsLeft(received.showTimeMs);
      setPhase('showing');

      const tick = window.setInterval(() => {
        setMsLeft((left) => Math.max(0, left - 100));
      }, 100);
      timers.current.push(tick);

      const hide = window.setTimeout(() => {
        window.clearInterval(tick);
        answerStartedAt.current = performance.now();
        setPhase('answering');
      }, received.showTimeMs);
      timers.current.push(hide);
    } catch (e) {
      setError(messageOf(e, 'Не удалось получить задание'));
      setPhase('idle');
    }
  }, [clearTimers, difficulty, gameType]);

  const start = useCallback(() => {
    setResults([]);
    setRound(1);
    void beginRound();
  }, [beginRound]);

  const answer = useCallback(
    async (payload: AnswerPayload) => {
      const current = currentTask.current;
      if (!current) return;

      clearTimers();
      setPhase('loading');

      try {
        const result = await submitAnswer({
          attemptId: current.attemptId,
          gameType: current.gameType,
          responseTimeMs: Math.round(performance.now() - answerStartedAt.current),
          ...payload,
        } as Parameters<typeof submitAnswer>[0]);

        setLastResult(result);
        setResults((previous) => [...previous, result]);
        setPhase('result');
      } catch (e) {
        setError(messageOf(e, 'Не удалось отправить ответ'));
        // Возвращаем к ответу: задание ещё не закрыто, попытку можно повторить.
        setPhase('answering');
      }
    },
    [clearTimers],
  );

  const next = useCallback(() => {
    if (round >= ROUNDS_PER_SESSION) {
      setTask(null);
      currentTask.current = null;
      setPhase('finished');
      return;
    }

    setRound((value) => value + 1);
    void beginRound();
  }, [beginRound, round]);

  const restart = useCallback(() => {
    clearTimers();
    setResults([]);
    setLastResult(null);
    setTask(null);
    currentTask.current = null;
    setRound(0);
    setPhase('idle');
  }, [clearTimers]);

  // Смена уровня сложности посреди серии сделала бы итог бессмысленным —
  // страница игры её и не разрешает, но на всякий случай начинаем заново.
  useEffect(() => {
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameType, difficulty]);

  const totalScore = results.reduce((sum, item) => sum + item.score, 0);
  const averageAccuracy =
    results.length === 0
      ? 0
      : Math.round((results.reduce((sum, item) => sum + item.accuracy, 0) / results.length) * 10) /
        10;

  return {
    phase,
    task,
    msLeft,
    round,
    totalRounds: ROUNDS_PER_SESSION,
    lastResult,
    results,
    totalScore,
    averageAccuracy,
    error,
    start,
    answer,
    next,
    restart,
  };
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
