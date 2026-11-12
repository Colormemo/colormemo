/**
 * Выбор игры.
 *
 * Запланированная игра из плана-максимум показана отдельной строкой без
 * ссылки: так видно, что раздел будет расти, и экран не придётся
 * переделывать, когда она появится.
 */

import { Link } from 'react-router-dom';

import { GAME_CATALOG, STATUS_LABELS } from '../features/games/catalog';
import { gamePath } from '../routes';

export function GamesPage() {
  return (
    <section className="page">
      <header className="page__head">
        <h1>Игры</h1>
        <p className="page__lead">
          В каждой игре серия из пяти заданий. Сложность задаётся временем показа и тем, насколько
          близки варианты.
        </p>
      </header>

      <ul className="game-list">
        {GAME_CATALOG.map((game) => {
          const available = game.status !== 'planned';

          const body = (
            <>
              <span className="game-row__name">{game.title}</span>
              <span className="game-row__about">{game.description}</span>
              <span className="game-row__state">
                {available ? 'Играть →' : STATUS_LABELS[game.status]}
              </span>
            </>
          );

          return (
            <li key={game.slug}>
              {available ? (
                <Link to={gamePath(game.slug)} className="game-row">
                  {body}
                </Link>
              ) : (
                <div className="game-row game-row--off">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
