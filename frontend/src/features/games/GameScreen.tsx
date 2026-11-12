/**
 * Каркас игрового экрана: всё, что одинаково у любой игры.
 *
 * Здесь живут счётчик раундов, обратный отсчёт показа, разбор раунда,
 * итоги серии и обработка ошибок. Конкретная игра приносит только три
 * куска разметки: чем показываем задание, чем на него отвечают и как
 * выглядит сравнение «было / выбрали».
 *
 * Разделение именно такое, потому что при добавлении третьей игры
 * («Воспроизведи последовательность» из плана-максимум) переписывать
 * цикл не придётся — достаточно принести свои три куска.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { GAME_TITLES, type GameResult, type GameTask } from '@colormemo/shared';

import { useAuth } from '../../auth/AuthContext';
import { ROUTES } from '../../routes';
import type { AnswerPayload, GameSession } from './useGameSession';

interface Props {
  session: GameSession;
  /** Короткое объяснение правил, видно до начала серии. */
  rules: string;
  stimulusHint: string;
  answerHint: string;
  renderStimulus: (task: GameTask) => ReactNode;
  renderAnswerForm: (task: GameTask, answer: (payload: AnswerPayload) => void) => ReactNode;
  renderComparison: (result: GameResult) => ReactNode;
}

export function GameScreen({
  session,
  rules,
  stimulusHint,
  answerHint,
  renderStimulus,
  renderAnswerForm,
  renderComparison,
}: Props) {
  const { user } = useAuth();
  const { phase, task, lastResult } = session;

  const inRound = phase === 'showing' || phase === 'answering' || phase === 'result';

  return (
    <div className="play">
      {inRound && (
        <div className="play__progress">
          <span className="play__round">
            Раунд {session.round} из {session.totalRounds}
          </span>
          <span className="play__score">{session.totalScore} очков</span>
        </div>
      )}

      {session.error && <p className="notice notice--error">{session.error}</p>}

      {phase === 'idle' && (
        <div className="play__intro">
          <p className="play__rules">{rules}</p>
          <p className="play__meta">
            {session.totalRounds} заданий подряд, в конце — средняя точность за серию.
            {!user && ' Результаты сохраняются только у вошедших в аккаунт.'}
          </p>
          <button type="button" className="button" onClick={session.start}>
            Начать
          </button>
        </div>
      )}

      {phase === 'loading' && <p className="play__hint">Загрузка…</p>}

      {phase === 'showing' && task && (
        <div className="play__stage">
          <p className="play__hint">{stimulusHint}</p>
          {renderStimulus(task)}
          <Countdown msLeft={session.msLeft} totalMs={task.showTimeMs} />
        </div>
      )}

      {phase === 'answering' && task && (
        <div className="play__stage">
          <p className="play__hint">{answerHint}</p>
          {renderAnswerForm(task, session.answer)}
        </div>
      )}

      {phase === 'result' && lastResult && (
        <div className="play__stage">
          <div className="verdict">
            <span className="verdict__value">{lastResult.accuracy}%</span>
            <span className="verdict__label">
              точность · {lastResult.score} очков
              {lastResult.isRecord && ' · личный рекорд'}
            </span>
          </div>

          {renderComparison(lastResult)}

          <button type="button" className="button" onClick={session.next}>
            {session.round >= session.totalRounds ? 'Итоги' : 'Дальше'}
          </button>
        </div>
      )}

      {phase === 'finished' && <Summary session={session} />}
    </div>
  );
}

/** Обратный отсчёт показа: полоса плюс цифры. */
function Countdown({ msLeft, totalMs }: { msLeft: number; totalMs: number }) {
  const left = totalMs === 0 ? 0 : Math.max(0, Math.min(1, msLeft / totalMs));

  return (
    <div className="countdown">
      <div className="countdown__track">
        <div className="countdown__bar" style={{ transform: `scaleX(${left})` }} />
      </div>
      <span className="countdown__value">{(msLeft / 1000).toFixed(1)} с</span>
    </div>
  );
}

/** Итоги серии. */
function Summary({ session }: { session: GameSession }) {
  const { user } = useAuth();
  const { results } = session;

  return (
    <div className="summary">
      <h2 className="summary__title">Серия пройдена</h2>

      <div className="summary__totals">
        <div>
          <span className="summary__value">{session.averageAccuracy}%</span>
          <span className="summary__label">средняя точность</span>
        </div>
        <div>
          <span className="summary__value">{session.totalScore}</span>
          <span className="summary__label">очков за серию</span>
        </div>
      </div>

      <ol className="rounds">
        {results.map((result, index) => (
          <li key={result.attemptId} className="rounds__item">
            <span className="rounds__number">{index + 1}</span>
            <span className="rounds__bar">
              <span className="rounds__fill" style={{ width: `${result.accuracy}%` }} />
            </span>
            <span className="rounds__accuracy">{result.accuracy}%</span>
          </li>
        ))}
      </ol>

      <div className="summary__actions">
        <button type="button" className="button" onClick={session.start}>
          Сыграть ещё
        </button>
        <Link to={ROUTES.games} className="button button--quiet">
          Другая игра
        </Link>
      </div>

      {user ? (
        <p className="play__meta">
          Результат сохранён. Он виден в <Link to={ROUTES.stats}>статистике</Link> и в{' '}
          <Link to={ROUTES.profile}>профиле</Link>.
        </p>
      ) : (
        <p className="play__meta">
          Чтобы результаты сохранялись и копилась статистика,{' '}
          <Link to={ROUTES.register}>заведите аккаунт</Link>.
        </p>
      )}
    </div>
  );
}

/** Подпись игры — пригодится экранам, которые не хотят дублировать названия. */
export function gameTitle(task: GameTask): string {
  return GAME_TITLES[task.gameType];
}
