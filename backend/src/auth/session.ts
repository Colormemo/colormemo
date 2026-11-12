/**
 * Сессия на стороне Express: положить токен в cookie, прочитать его обратно,
 * снять при выходе.
 *
 * Фронт и API живут на одном домене, поэтому cookie обычная, своя для сайта:
 * sameSite lax, без secure в разработке. Межсайтовых cookie с их `sameSite:
 * none; secure` здесь не нужно — это одна из причин, по которой проект
 * собран на один домен.
 */

import type { Request, Response } from 'express';

import { env } from '../env';
import { SESSION_COOKIE, SESSION_TTL_MS, createToken, parseCookies, readToken } from './token';

/** Ставит cookie сессии. */
export function setSessionCookie(res: Response, userId: string): void {
  res.cookie(SESSION_COOKIE, createToken(userId, env.authSecret), {
    httpOnly: true,
    sameSite: 'lax',
    // В разработке сайт открыт по http, и secure-cookie браузер бы не принял.
    secure: env.isProduction,
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

/** Снимает cookie сессии (выход из аккаунта). */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
  });
}

/**
 * id текущего пользователя или null, если сессии нет.
 * Токен проверяется на каждый запрос: сервер не хранит список сессий,
 * доверие даёт подпись.
 */
export function currentUserId(req: Request): string | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;

  return readToken(token, env.authSecret);
}
