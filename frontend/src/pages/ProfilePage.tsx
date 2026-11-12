/**
 * Профиль: аккаунт, личные рекорды и история прохождений.
 * Задача 38 по лабе 4.
 */

import { Link } from 'react-router-dom';

import { GAME_TITLES, type HistoryEntry } from '@colormemo/shared';

import { getHistory, getStats } from '../api';
import { useAuth } from '../auth/AuthContext';
import { PageEmpty, PageError, PageLoading } from '../components/PageState';
import { useRequest } from '../lib/useRequest';
import { ROUTES } from '../routes';

const LEVEL_NAMES: Record<number, string> = { 1: 'обычный', 2: 'сложный' };

export function ProfilePage() {
  const { user, logout } = useAuth();
  const stats = useRequest(getStats);
  const history = useRequest(() => getHistory());

  const loading = stats.loading || history.loading;
  const error = stats.error ?? history.error;

  return (
    <section className="page">
      <header className="page__head">
        <h1>Профиль</h1>
        {user && (
          <p className="page__lead">
            {user.login} · с {formatDate(user.createdAt)}
          </p>
        )}
      </header>

      {loading && <PageLoading />}

      {!loading && error && (
        <PageError
          message={error}
          onRetry={() => {
            stats.reload();
            history.reload();
          }}
        />
      )}

      {!loading && !error && stats.data && history.data && (
        <>
          {stats.data.totalAttempts === 0 ? (
            <PageEmpty
              title="Сохранённых результатов пока нет"
              hint="Пройдите серию заданий — здесь появятся личные рекорды и история прохождений."
              action={
                <Link to={ROUTES.games} className="button">
                  Выбрать игру
                </Link>
              }
            />
          ) : (
            <>
              <section className="block">
                <h2 className="block__title">Личные рекорды</h2>
                <ul className="records">
                  {stats.data.byGame.map((row) => (
                    <li key={`${row.gameType}:${row.difficulty}`} className="records__item">
                      <span className="records__game">
                        {GAME_TITLES[row.gameType]}
                        <span className="chip">
                          {LEVEL_NAMES[row.difficulty] ?? row.difficulty}
                        </span>
                      </span>
                      <span className="records__value">{row.bestScore} очков</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="block">
                <h2 className="block__title">История прохождений</h2>
                <ul className="history">
                  {history.data.entries.map((entry) => (
                    <HistoryRow key={entry.id} entry={entry} />
                  ))}
                </ul>
                <p className="page__note">
                  Сводные цифры — в <Link to={ROUTES.stats}>статистике</Link>.
                </p>
              </section>
            </>
          )}
        </>
      )}

      <button type="button" className="button button--quiet" onClick={() => void logout()}>
        Выйти из аккаунта
      </button>
    </section>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  return (
    <li className="history__item">
      <span className="history__when">{formatDateTime(entry.playedAt)}</span>

      <span className="history__game">
        {GAME_TITLES[entry.gameType]}
        <span className="chip">{LEVEL_NAMES[entry.difficulty] ?? entry.difficulty}</span>
      </span>

      <span className="history__accuracy">{entry.accuracy}%</span>
      <span className="history__score">{entry.score}</span>
    </li>
  );
}

/*
 * Форматируем через Intl, а не руками: тогда дата выглядит привычно
 * и не ломается на часовых поясах — сервер отдаёт время в UTC.
 */
const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}
