/**
 * Выбор игры.
 *
 * Запланированная игра из плана-максимум показана карточкой без ссылки:
 * так видно, что раздел будет расти, и экран не придётся переделывать,
 * когда она появится.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { randomTargetColor } from '@colormemo/shared';

import { GAME_CATALOG, STATUS_LABELS } from '../features/games/catalog';
import { gamePath } from '../routes';

export function GamesPage() {
  // Обложки — настоящие цвета заданий, а не картинки из заготовки.
  const covers = useMemo(
    () => GAME_CATALOG.map(() => [randomTargetColor(), randomTargetColor()]),
    [],
  );

  return (
    <section className="page">
      <header className="page__head">
        <h1>Игры</h1>
        <p className="page__lead">
          В каждой игре серия из пяти заданий. Сложность задаётся временем показа и тем, насколько
          близки варианты.
        </p>
      </header>

      <ul className="cards">
        {GAME_CATALOG.map((game, index) => {
          const available = game.status !== 'planned';
          const [from, to] = covers[index];

          const body = (
            <>
              <div className="card__top">
                <span className="card__name">{game.title}</span>
                <span className={available ? 'badge' : 'badge badge--quiet'}>
                  {STATUS_LABELS[game.status]}
                </span>
              </div>

              <p className="card__about">{game.description}</p>

              <div
                className="card__thumb"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              />

              <span className="card__play">{available ? 'Играть' : 'Скоро'}</span>
            </>
          );

          return (
            <li key={game.slug}>
              {available ? (
                <Link to={gamePath(game.slug)} className="card">
                  {body}
                </Link>
              ) : (
                <div className="card card--off">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
