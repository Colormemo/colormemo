import { Link } from 'react-router-dom';

import { GAME_CATALOG, STATUS_LABELS } from '../features/games/catalog';
import { gamePath } from '../routes';

export function GamesPage() {
  return (
    <section className="page">
      <h1>Игры</h1>

      <ul className="cards">
        {GAME_CATALOG.map((game) => {
          const available = game.status !== 'planned';

          return (
            <li key={game.slug} className="card">
              <div className="card__head">
                <h2>{game.title}</h2>
                <span className={`tag tag--${game.status}`}>{STATUS_LABELS[game.status]}</span>
              </div>

              <p className="card__text">{game.description}</p>

              {available ? (
                <Link to={gamePath(game.slug)} className="primary primary--link">
                  Играть
                </Link>
              ) : (
                <span className="card__note">Появится в следующих версиях</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
