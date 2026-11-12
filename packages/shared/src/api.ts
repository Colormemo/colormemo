/**
 * Контракт API: какие ручки есть и что они принимают и возвращают.
 *
 * Это тот самый документ, о котором нам с Настей надо договориться ДО кода.
 * Пока бэка нет, фронт работает на моках, реализующих эти же типы, —
 * потом подменяется один модуль запросов и всё сходится.
 */

import type { Difficulty, GameResult, GameTask, GameType } from './games';

export interface PublicUser {
  id: string;
  login: string;
  createdAt: string;
}

// --- Авторизация -----------------------------------------------------------

export interface RegisterRequest {
  login: string;
  password: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  user: PublicUser;
}

// --- Игровая сессия --------------------------------------------------------

export interface StartTaskRequest {
  gameType: GameType;
  difficulty: Difficulty;
}

/** Ответ сервера на запрос нового задания. */
export type StartTaskResponse = GameTask;

/** Ответ сервера на отправленный ответ игрока. */
export type SubmitAnswerResponse = GameResult;

// --- Статистика ------------------------------------------------------------

export interface GameStats {
  gameType: GameType;
  difficulty: Difficulty;
  /** сколько заданий пройдено */
  attempts: number;
  /** средняя точность, % */
  averageAccuracy: number;
  /** лучший результат по очкам */
  bestScore: number;
  /** очки последних попыток по порядку — для графика прогресса */
  recentScores: number[];
}

export interface StatsResponse {
  totalAttempts: number;
  totalScore: number;
  /** средняя точность по всем играм, % */
  averageAccuracy: number;
  byGame: GameStats[];
}

// --- История прохождений ---------------------------------------------------

/** Одна строка истории: что игрок проходил и с каким результатом. */
export interface HistoryEntry {
  id: string;
  gameType: GameType;
  difficulty: Difficulty;
  accuracy: number;
  score: number;
  responseTimeMs: number;
  /** когда ответили, в формате ISO */
  playedAt: string;
}

export interface HistoryResponse {
  entries: HistoryEntry[];
}

/** Сколько последних попыток показываем в профиле по умолчанию. */
export const HISTORY_LIMIT = 20;

/** Список адресов, чтобы фронт и бэк не расходились в путях. */
export const API_ROUTES = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
  startTask: '/api/games/task',
  submitAnswer: '/api/games/answer',
  stats: '/api/stats',
  history: '/api/stats/history',
} as const;

// --- Ограничения на логин и пароль ----------------------------------------

/**
 * Правила для логина и пароля лежат здесь, а не в форме и не в ручке:
 * одна и та же проверка нужна на клиенте (чтобы сразу показать ошибку)
 * и на сервере (потому что клиенту доверять нельзя).
 */
export const LOGIN_MIN_LENGTH = 3;
export const LOGIN_MAX_LENGTH = 24;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

/** Логин: латиница, цифры, дефис и подчёркивание. */
export const LOGIN_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Текст ошибки или null, если логин подходит. */
export function validateLogin(login: string): string | null {
  if (login.length < LOGIN_MIN_LENGTH) {
    return `Логин короче ${LOGIN_MIN_LENGTH} символов`;
  }
  if (login.length > LOGIN_MAX_LENGTH) {
    return `Логин длиннее ${LOGIN_MAX_LENGTH} символов`;
  }
  if (!LOGIN_PATTERN.test(login)) {
    return 'В логине допустимы латинские буквы, цифры, дефис и подчёркивание';
  }
  return null;
}

/** Текст ошибки или null, если пароль подходит. */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Пароль короче ${PASSWORD_MIN_LENGTH} символов`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Пароль длиннее ${PASSWORD_MAX_LENGTH} символов`;
  }
  return null;
}
