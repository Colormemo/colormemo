/**
 * Единственное место в приложении, которое знает про сеть.
 *
 * Адреса относительные — и в разработке, и в готовом виде фронт и API живут
 * на одном домене. Поэтому нет ни CORS, ни настройки адреса сервера:
 *   - в разработке /api уходит на localhost:3000 через прокси Vite;
 *   - в готовом виде тот же сервер отдаёт и сайт, и /api.
 *
 * Заглушки (VITE_USE_MOCK) остаются: на них пишется игровая логика,
 * пока соответствующие ручки API ещё не готовы.
 */

import {
  API_ROUTES,
  type Difficulty,
  type GameAnswer,
  type GameResult,
  type GameTask,
  type GameType,
} from '@colormemo/shared';

import { mockStartTask, mockSubmitAnswer } from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Один домен, поэтому cookie уходит сама. credentials оставляем
    // явным: так понятнее, что авторизация держится на cookie.
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Сервер отвечает ошибками в JSON, стараемся показать понятный текст
    const problem = await response.json().catch(() => null);
    throw new Error(problem?.error ?? `Запрос ${path} завершился ошибкой ${response.status}`);
  }

  return (await response.json()) as T;
}

export function startTask(gameType: GameType, difficulty: Difficulty): Promise<GameTask> {
  if (USE_MOCK) return mockStartTask(gameType, difficulty);
  return post<GameTask>(API_ROUTES.startTask, { gameType, difficulty });
}

export function submitAnswer(answer: GameAnswer): Promise<GameResult> {
  if (USE_MOCK) return mockSubmitAnswer(answer);

  // Сервер ждёт taskId, а не attemptId — приводим здесь, чтобы игровой код
  // не знал про особенности формата запросов.
  const { attemptId, ...rest } = answer;
  return post<GameResult>(API_ROUTES.submitAnswer, { taskId: attemptId, ...rest });
}

export const isMockMode = USE_MOCK;
