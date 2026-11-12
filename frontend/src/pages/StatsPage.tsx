/**
 * Статистика: число попыток, лучший результат и средняя точность
 * по каждой игре и уровню. Задача 39 по лабе 4.
 *
 * Игра и уровень считаются отдельно: средняя точность на первом уровне
 * и на втором — разные величины, и в одной цифре они только мешали бы
 * друг другу.
 */

import { Link } from 'react-router-dom';

import { GAME_TITLES, type GameStats } from '@colormemo/shared';

import { getStats } from '../api';
import { PageEmpty, PageError, PageLoading } from '../components/PageState';
import { useRequest } from '../lib/useRequest';
import { ROUTES } from '../routes';

const LEVEL_NAMES: Record<number, string> = { 1: 'обычный', 2: 'сложный' };

export function StatsPage() {
  const { data, error, loading, reload } = useRequest(getStats);

  return (
    <section className="page">
      <header className="page__head">
        <h1>Статистика</h1>
        <p className="page__lead">Сколько заданий пройдено и насколько точно.</p>
      </header>

      {loading && <PageLoading />}
      {!loading && error && <PageError message={error} onRetry={reload} />}

      {!loading && !error && data && data.totalAttempts === 0 && (
        <PageEmpty
          title="Пока нечего показывать"
          hint="Пройдите серию заданий — здесь появятся средняя точность, лучший результат и прогресс по последним попыткам."
          action={
            <Link to={ROUTES.games} className="button">
              Выбрать игру
            </Link>
          }
        />
      )}

      {!loading && !error && data && data.totalAttempts > 0 && (
        <>
          <div className="totals">
            <Total value={data.totalAttempts} label="заданий пройдено" />
            <Total value={`${data.averageAccuracy}%`} label="средняя точность" />
            <Total value={data.totalScore} label="очков всего" />
          </div>

          <ul className="stat-list">
            {data.byGame.map((row) => (
              <li key={`${row.gameType}:${row.difficulty}`} className="stat">
                <div className="stat__head">
                  <h2 className="stat__title">{GAME_TITLES[row.gameType]}</h2>
                  <span className="chip">{LEVEL_NAMES[row.difficulty] ?? row.difficulty}</span>
                </div>

                <dl className="stat__facts">
                  <Fact term="попыток" value={row.attempts} />
                  <Fact term="средняя точность" value={`${row.averageAccuracy}%`} />
                  <Fact term="лучший результат" value={`${row.bestScore} очков`} />
                </dl>

                <Progress row={row} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Total({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="totals__item">
      <span className="totals__value">{value}</span>
      <span className="totals__label">{label}</span>
    </div>
  );
}

function Fact({ term, value }: { term: string; value: number | string }) {
  return (
    <div className="stat__fact">
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * Очки последних попыток столбиками.
 *
 * Высота считается от лучшего результата внутри этой же строки, а не от
 * общего максимума: сравнивать здесь нужно попытки между собой, а разные
 * игры дают разное число очков за одно и то же.
 */
function Progress({ row }: { row: GameStats }) {
  if (row.recentScores.length < 2) return null;

  const max = Math.max(...row.recentScores, 1);

  return (
    <div className="spark" aria-hidden="true">
      {row.recentScores.map((score, index) => (
        <span
          key={index}
          className="spark__bar"
          style={{ height: `${Math.max(6, (score / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
