/**
 * Страница игры: разбирает адрес, держит выбранный уровень сложности
 * и подставляет нужный игровой экран.
 *
 * Сам цикл раундов живёт в useGameSession и одинаков для всех игр,
 * поэтому страница про него почти ничего не знает — только создаёт сессию
 * и отдаёт её экрану игры.
 */

import { Link, useParams } from 'react-router-dom';

import { MAX_DIFFICULTY, type Difficulty } from '@colormemo/shared';

import { ColorChoiceGame } from '../features/games/ColorChoiceGame';
import { ColorRecallGame } from '../features/games/ColorRecallGame';
import { findGameBySlug } from '../features/games/catalog';
import { useGameSession } from '../features/games/useGameSession';
import { useDifficulty } from '../features/games/useDifficulty';
import { ROUTES } from '../routes';
import { NotFoundPage } from './NotFoundPage';

const LEVELS = Array.from({ length: MAX_DIFFICULTY }, (_, index) => (index + 1) as Difficulty);

const LEVEL_NAMES: Record<number, string> = {
  1: 'обычный',
  2: 'сложный',
};

export function GamePage() {
  const { gameSlug } = useParams();
  const game = findGameBySlug(gameSlug);
  const [difficulty, setDifficulty] = useDifficulty();

  // Хуки обязаны вызываться в одном и том же порядке при каждом отрисовывании,
  // поэтому сессию создаём до проверки на «нет такой игры». Для
  // несуществующего адреса берём любой допустимый вид игры: экран
  // всё равно не покажется.
  const session = useGameSession(game?.gameType ?? 'COLOR_RECALL', difficulty);

  if (!game || game.status === 'planned') return <NotFoundPage />;

  // Пока идёт серия, уровень менять нельзя: иначе средняя точность за серию
  // окажется собрана из заданий разной сложности и ничего не будет значить.
  const levelsLocked = session.phase !== 'idle' && session.phase !== 'finished';

  return (
    <section className="page">
      <Link to={ROUTES.games} className="back">
        ← Все игры
      </Link>

      <header className="page__head">
        <h1>{game.title}</h1>
        <p className="page__lead">{game.description}</p>
      </header>

      <div className="levels" role="group" aria-label="Уровень сложности">
        <span className="levels__label">Сложность</span>
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={level === difficulty ? 'levels__item levels__item--on' : 'levels__item'}
            onClick={() => setDifficulty(level)}
            disabled={levelsLocked}
            aria-pressed={level === difficulty}
          >
            {LEVEL_NAMES[level] ?? level}
          </button>
        ))}
      </div>

      {levelsLocked && <p className="levels__note">Уровень можно сменить после серии.</p>}

      {game.gameType === 'COLOR_CHOICE' ? (
        <ColorChoiceGame session={session} />
      ) : (
        <ColorRecallGame session={session} />
      )}
    </section>
  );
}
