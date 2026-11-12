/**
 * Кто вошёл в приложение. Задача 33 по лабе 4, клиентская часть.
 *
 * Пользователь хранится в одном месте, потому что он нужен сразу нескольким
 * экранам: шапке (показать логин и выход), профилю, статистике и защищённым
 * маршрутам. Если бы каждый экран спрашивал сервер сам, при переходах
 * получалась бы пачка одинаковых запросов и мигание «вошёл / не вошёл».
 *
 * Токена здесь нет и не будет: он лежит в httpOnly-cookie, недоступной
 * скриптам страницы. Клиент знает только, кто вошёл, а не чем это доказано.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { PublicUser } from '@colormemo/shared';

import * as api from '../api';

interface AuthState {
  user: PublicUser | null;
  /** true, пока не выяснили, есть ли сессия: до этого решать нечего. */
  loading: boolean;
  login(login: string, password: string): Promise<void>;
  register(login: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  // При запуске спрашиваем сервер, есть ли живая сессия: cookie могла
  // остаться с прошлого визита, а могла и протухнуть.
  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then((found) => {
        if (!cancelled) setUser(found);
      })
      .catch(() => {
        // Сервер недоступен — считаем, что никто не вошёл, и даём работать
        // дальше: играть можно и гостем.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (loginName: string, password: string) => {
    setUser(await api.login(loginName, password));
  }, []);

  const register = useCallback(async (loginName: string, password: string) => {
    setUser(await api.register(loginName, password));
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth вызван вне AuthProvider');
  return context;
}
