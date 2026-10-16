/**
 * Маршрутизация приложения. Задача 32 по лабе 4.
 *
 * Все страницы лежат внутри общего каркаса AppLayout, поэтому шапка
 * и навигация описаны один раз.
 *
 * Роутер выбран обычный, с адресами вида /games/repeat-color, а не с решёткой:
 * фронт и сервер живут на одном домене, и сервер отдаёт index.html на любой
 * адрес, не начинающийся с /api, — значит перезагрузка вложенной страницы
 * не ломается.
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './layout/AppLayout';
import { GamePage } from './pages/GamePage';
import { GamesPage } from './pages/GamesPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { StatsPage } from './pages/StatsPage';
import { ROUTES } from './routes';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.games} element={<GamesPage />} />
          <Route path={ROUTES.gamePattern} element={<GamePage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.profile} element={<ProfilePage />} />
          <Route path={ROUTES.stats} element={<StatsPage />} />

          {/* Старый адрес прототипа, чтобы ссылки из чатов не ломались */}
          <Route path="/game" element={<Navigate to={ROUTES.games} replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
