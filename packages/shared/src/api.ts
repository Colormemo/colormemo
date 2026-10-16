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
  byGame: GameStats[];
}

/** Список адресов, чтобы фронт и бэк не расходились в путях. */
export const API_ROUTES = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
  startTask: '/api/games/task',
  submitAnswer: '/api/games/answer',
  stats: '/api/stats',
} as const;
