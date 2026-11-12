/**
 * Единственное место в приложении, которое знает про сеть.
 *
 * Адреса относительные — и в разработке, и в готовом виде фронт и API живут
 * на одном домене. Поэтому нет ни CORS, ни настройки адреса сервера:
 *   - в разработке /api уходит на localhost:3000 через прокси Vite;
 *   - в готовом виде тот же сервер отдаёт и сайт, и /api.
 *
 * Сессия держится на httpOnly-cookie: токена в коде страницы нет и быть
 * не должно, браузер сам прикладывает cookie к каждому запросу.
 */

import {
  API_ROUTES,
  type AuthResponse,
  type Difficulty,
  type GameAnswer,
  type GameResult,
  type GameTask,
  type GameType,
  type HistoryResponse,
  type PublicUser,
  type StatsResponse,
} from '@colormemo/shared';

/**
 * Ошибка запроса с кодом ответа.
 *
 * Код нужен страницам: 401 — это «надо войти», и показывать его как
 * обычную поломку нельзя, иначе человек решит, что сайт сломался.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      // Один домен, поэтому cookie уходит сама. credentials оставляем
      // явным: так понятнее, что сессия держится на cookie.
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Сюда попадаем, когда ответа нет вовсе: сервер не поднят или пропала сеть.
    throw new ApiError('Сервер не отвечает. Проверьте, запущен ли он.', 0);
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(problem?.error ?? `Ошибка ${response.status}`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const get = <T>(path: string) => send<T>(path, 'GET');
const post = <T>(path: string, body?: unknown) => send<T>(path, 'POST', body ?? {});

// --- Авторизация -----------------------------------------------------------

export function register(login: string, password: string): Promise<PublicUser> {
  return post<AuthResponse>(API_ROUTES.register, { login, password }).then((r) => r.user);
}

export function login(loginName: string, password: string): Promise<PublicUser> {
  return post<AuthResponse>(API_ROUTES.login, { login: loginName, password }).then((r) => r.user);
}

export function logout(): Promise<void> {
  return post<void>(API_ROUTES.logout);
}

/** Текущий пользователь или null, если сессии нет. */
export async function me(): Promise<PublicUser | null> {
  try {
    const response = await get<AuthResponse>(API_ROUTES.me);
    return response.user;
  } catch (error) {
    // 401 здесь — не поломка, а обычное «никто не вошёл».
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

// --- Игры ------------------------------------------------------------------

export function startTask(gameType: GameType, difficulty: Difficulty): Promise<GameTask> {
  return post<GameTask>(API_ROUTES.startTask, { gameType, difficulty });
}

export function submitAnswer(answer: GameAnswer): Promise<GameResult> {
  // Сервер ждёт taskId, а не attemptId — приводим здесь, чтобы игровой код
  // не знал про особенности формата запросов.
  const { attemptId, ...rest } = answer;
  return post<GameResult>(API_ROUTES.submitAnswer, { taskId: attemptId, ...rest });
}

// --- Статистика ------------------------------------------------------------

export function getStats(): Promise<StatsResponse> {
  return get<StatsResponse>(API_ROUTES.stats);
}

export function getHistory(limit?: number): Promise<HistoryResponse> {
  const query = limit === undefined ? '' : `?limit=${limit}`;
  return get<HistoryResponse>(`${API_ROUTES.history}${query}`);
}
