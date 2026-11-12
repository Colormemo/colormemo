/**
 * Общий каркас страниц: шапка с навигацией и место под содержимое.
 *
 * Навигация описана одним списком: при добавлении раздела правка будет
 * в одном месте, а не на каждом экране.
 */

import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes';

const NAV_ITEMS = [
  { to: ROUTES.games, label: 'Игры' },
  { to: ROUTES.stats, label: 'Статистика' },
  { to: ROUTES.profile, label: 'Профиль' },
];

export function AppLayout() {
  const { user, loading, logout } = useAuth();

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
              className={({ isActive }) => (isActive ? 'nav__link nav__link--on' : 'nav__link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/*
          Пока сессия не проверена, место под учётную запись держим пустым:
          иначе при каждой перезагрузке на долю секунды мигает «Войти»,
          даже если человек вошёл.
        */}
        {!loading &&
          (user ? (
            <div className="account">
              <Link to={ROUTES.profile} className="account__name">
                {user.login}
              </Link>
              <button type="button" className="account__exit" onClick={() => void logout()}>
                Выйти
              </button>
            </div>
          ) : (
            <div className="account">
              <NavLink to={ROUTES.login} className="nav__link">
                Войти
              </NavLink>
              <NavLink to={ROUTES.register} className="account__cta">
                Регистрация
              </NavLink>
            </div>
          ))}
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
