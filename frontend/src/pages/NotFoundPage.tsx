import { Link } from 'react-router-dom';

import { ROUTES } from '../routes';

export function NotFoundPage() {
  return (
    <section className="page">
      <h1>Страница не найдена</h1>
      <p className="lead">Возможно, адрес набран с ошибкой или раздел ещё не готов.</p>
      <Link to={ROUTES.home} className="primary primary--link">
        На главную
      </Link>
    </section>
  );
}
