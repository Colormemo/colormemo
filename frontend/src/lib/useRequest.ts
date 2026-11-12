/**
 * Загрузка данных с сервера: три состояния и повтор.
 *
 * Отдельный хук нужен, чтобы профиль и статистика одинаково вели себя
 * в загрузке, в ошибке и при повторе, а не расходились мелочами.
 * Полноценная библиотека кеширования здесь избыточна: экранов два,
 * данные маленькие.
 */

import { useCallback, useEffect, useState } from 'react';

interface State<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload(): void;
}

export function useRequest<T>(request: () => Promise<T>): State<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Ответ медленного запроса может прийти, когда страницу уже закрыли
    // или данные успели перезапросить. Флаг не даёт записать устаревшее.
    let cancelled = false;

    setLoading(true);
    setError(null);

    request()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить данные');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // request пересоздаётся на каждом отрисовывании страницы, поэтому
    // в зависимостях его нет: перезапрос запускается явно через reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, error, loading, reload };
}
