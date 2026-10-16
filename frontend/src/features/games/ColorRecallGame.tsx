/**
 * Прототип игрового экрана «Повтори цвет» (задача 36 по лабе 4).
 * Оформление черновое: финальный экран собирается после макета
 * и проработки состояний показа и ввода ответа (задачи 16 и 19).
 *
 * Игра «Повтори цвет» — рабочий пример на весь цикл:
 * запросили задание, показали цвет, спрятали, приняли ответ, показали разбор.
 *
 * Это образец, а не финальный экран: дизайн появится после макетов Кати.
 * Смысл в том, что схема работы уже проверена и её можно повторить
 * для «Выбери цвет» и «Воспроизведи последовательность».
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import { readableTextColor, type Difficulty, type GameResult, type Hex } from '@colormemo/shared';

import { startTask, submitAnswer } from '../../api';

type Phase = 'idle' | 'loading' | 'showing' | 'answering' | 'result';

interface Props {
  difficulty: Difficulty;
}

export function ColorRecallGame({ difficulty }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [targetColor, setTargetColor] = useState<Hex | null>(null);
  const [picked, setPicked] = useState<string>('#888888');
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msLeft, setMsLeft] = useState(0);

  /**
   * Момент, когда цвет спрятался. Отсчитываем от него время ответа.
   * performance.now() устойчивее Date.now(): не сбивается, если у игрока
   * подвинулись системные часы.
   */
  const answerStartedAt = useRef<number>(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const startRound = useCallback(async () => {
    clearTimers();
    setError(null);
    setResult(null);
    setPhase('loading');

    try {
      const task = await startTask('COLOR_RECALL', difficulty);
      if (task.gameType !== 'COLOR_RECALL') throw new Error('Сервер вернул задание другой игры');

      setTaskId(task.attemptId);
      setTargetColor(task.targetColor);
      setPicked('#888888');
      setPhase('showing');
      setMsLeft(task.showTimeMs);

      // обратный отсчёт на экране
      const tick = window.setInterval(() => {
        setMsLeft((left) => Math.max(0, left - 100));
      }, 100);
      timers.current.push(tick);

      // прячем цвет и переходим к ответу
      const hide = window.setTimeout(() => {
        window.clearInterval(tick);
        answerStartedAt.current = performance.now();
        setPhase('answering');
      }, task.showTimeMs);
      timers.current.push(hide);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось получить задание');
      setPhase('idle');
    }
  }, [difficulty]);

  const send = useCallback(async () => {
    if (!taskId) return;
    setPhase('loading');

    try {
      const answered = await submitAnswer({
        attemptId: taskId,
        gameType: 'COLOR_RECALL',
        pickedColor: picked as Hex,
        responseTimeMs: Math.round(performance.now() - answerStartedAt.current),
      });
      setResult(answered);
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить ответ');
      setPhase('answering');
    }
  }, [picked, taskId]);

  return (
    <section className="game">
      <h2>Повтори цвет</h2>

      {error && <p className="error">{error}</p>}

      {phase === 'idle' && (
        <button type="button" className="primary" onClick={startRound}>
          Начать
        </button>
      )}

      {phase === 'loading' && <p>Загрузка…</p>}

      {phase === 'showing' && targetColor && (
        <>
          <p className="hint">Запоминайте цвет</p>
          <div className="swatch swatch--big" style={{ background: targetColor }} />
          <p className="countdown">{(msLeft / 1000).toFixed(1)} с</p>
        </>
      )}

      {phase === 'answering' && (
        <>
          <p className="hint">Какой это был цвет?</p>
          <HexColorPicker color={picked} onChange={setPicked} />
          <div
            className="swatch"
            style={{ background: picked, color: readableTextColor(picked as Hex) }}
          >
            {picked}
          </div>
          <button type="button" className="primary" onClick={send}>
            Ответить
          </button>
        </>
      )}

      {phase === 'result' && result && (
        <>
          <p className="accuracy">Точность: {result.accuracy}%</p>
          <p>
            Очки: {result.score}
            {result.isRecord && ' — личный рекорд'}
          </p>

          <div className="compare">
            <div>
              <span>было</span>
              <div className="swatch" style={{ background: result.correct.color }} />
              <code>{result.correct.color}</code>
            </div>
            <div>
              <span>вы выбрали</span>
              <div className="swatch" style={{ background: result.given.color }} />
              <code>{result.given.color}</code>
            </div>
          </div>

          <button type="button" className="primary" onClick={startRound}>
            Ещё раз
          </button>
        </>
      )}
    </section>
  );
}
