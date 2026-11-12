/**
 * Маршрут только для вошедших. Профиль и статистика без аккаунта пусты
 * по смыслу, поэтому вместо пустого экрана отправляем на вход.
 *
 * Адрес, куда человек шёл, запоминаем в состоянии перехода: после входа
 * он попадёт туда, а не на главную.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PageLoading } from '../components/PageState';
import { ROUTES } from '../routes';
import { useAuth } from './AuthContext';

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Пока сессия не проверена, решать нельзя: иначе вошедшего выбросит
  // на страницу входа на долю секунды при каждой перезагрузке.
  if (loading) return <PageLoading text="Проверяем сессию…" />;

  if (!user) {
    return <Navigate to={ROUTES.login} state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
