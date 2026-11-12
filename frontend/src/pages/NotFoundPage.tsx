import { Link } from 'react-router-dom';

import { ROUTES } from '../routes';

export function NotFoundPage() {
  return (
    <section className="page page--narrow">
      <header className="page__head">
        <h1>Страница не найдена</h1>
        <p className="page__lead">Возможно, адрес набран с ошибкой или раздел ещё не готов.</p>
      </header>

      <Link to={ROUTES.home} className="button">
        На главную
      </Link>
    </section>
  );
}
