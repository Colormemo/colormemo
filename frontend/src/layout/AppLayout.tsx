/**
 * Общий каркас страниц: шапка с навигацией и место под содержимое.
 *
 * Оформление черновое и заменится на UI-kit (задачи 12–14 по лабе 4).
 * Здесь важна структура: один набор навигации на все страницы,
 * чтобы при добавлении раздела не править каждый экран.
 */

import { NavLink, Outlet } from 'react-router-dom';

import { isMockMode } from '../api';
import { ROUTES } from '../routes';

const NAV_ITEMS = [
  { to: ROUTES.games, label: 'Игры' },
  { to: ROUTES.stats, label: 'Статистика' },
  { to: ROUTES.profile, label: 'Профиль' },
];

export function AppLayout() {
  return (
    <div className="app">
      <header className="header">
        <NavLink to={ROUTES.home} className="logo">
          ColorMemo
        </NavLink>

        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav__link nav__link--active' : 'nav__link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <NavLink to={ROUTES.login} className="nav__link">
          Войти
        </NavLink>
      </header>

      {isMockMode && (
        <p className="badge">
          Режим заглушек: сервер не подключён, результаты не сохраняются. Переключается в .env.local
        </p>
      )}

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">Учебный проект, Московский Политех, группа 231-334</footer>
    </div>
  );
}
