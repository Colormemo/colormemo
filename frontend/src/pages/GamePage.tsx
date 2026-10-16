/**
 * Страница конкретной игры. Разбирает адрес, выбирает уровень сложности
 * и подставляет нужный игровой экран.
 *
 * Сами игровые экраны (задачи 35 и 36 по лабе 4) зависят от макетов
 * 15–21, поэтому здесь пока подключён только прототип «Повтори цвет»,
 * а «Выбери цвет» ждёт макета.
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { MAX_DIFFICULTY, type Difficulty } from '@colormemo/shared';

import { ColorRecallGame } from '../features/games/ColorRecallGame';
import { findGameBySlug } from '../features/games/catalog';
import { ROUTES } from '../routes';
import { NotFoundPage } from './NotFoundPage';

const LEVELS = Array.from({ length: MAX_DIFFICULTY }, (_, i) => (i + 1) as Difficulty);

export function GamePage() {
  const { gameSlug } = useParams();
  const game = findGameBySlug(gameSlug);
  const [difficulty, setDifficulty] = useState<Difficulty>(1);

  if (!game || game.status === 'planned') return <NotFoundPage />;

  return (
    <section className="page">
      <Link to={ROUTES.games} className="back">
        ← Все игры
      </Link>

      <div className="levels">
        <span>Сложность:</span>
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={level === difficulty ? 'level level--active' : 'level'}
            onClick={() => setDifficulty(level)}
            aria-pressed={level === difficulty}
          >
            {level}
          </button>
        ))}
      </div>

      {game.gameType === 'COLOR_RECALL' ? (
        <ColorRecallGame difficulty={difficulty} />
      ) : (
        <div className="state">
          <p className="state__title">Экран игры «{game.title}» в разработке</p>
          <p className="state__hint">
            Интерфейс собирается после макета и состояний выбора ответа (задачи 15, 18 и 20 по
            плану). Логика генерации вариантов и проверки ответа на сервере уже готова.
          </p>
        </div>
      )}
    </section>
  );
}
