import { Link } from 'react-router-dom';

import { ROUTES } from '../routes';

export function HomePage() {
  return (
    <section className="page">
      <h1>Тренировка зрительной памяти и цветового восприятия</h1>

      <p className="lead">
        Короткие задания на запоминание, распознавание и подбор оттенков. Результаты сохраняются,
        по ним видно, как меняется точность.
      </p>

      <Link to={ROUTES.games} className="primary primary--link">
        Выбрать игру
      </Link>
    </section>
  );
}
