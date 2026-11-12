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

/**
 * Помечать ли cookie как «только для защищённого соединения».
 *
 * Решаем по тому, как пришёл запрос, а не по режиму сборки. Если жёстко
 * поставить secure в production, приложение в контейнере перестанет пускать
 * внутрь по http://localhost — браузер просто не примет cookie, и вход
 * будет молча не срабатывать. Если не ставить никогда, то за туннелем или
 * за настоящим хостингом cookie поедет и по открытому каналу.
 *
 * req.secure сам по себе знает только про соединение до сервера, а за
 * прокси оно всегда http. Поэтому в app.ts включено доверие к первому
 * прокси, и Express читает настоящий протокол из X-Forwarded-Proto.
 */
function isSecure(req: Request): boolean {
  return req.secure;
}

/** Ставит cookie сессии. */
export function setSessionCookie(req: Request, res: Response, userId: string): void {
  res.cookie(SESSION_COOKIE, createToken(userId, env.authSecret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure(req),
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

/**
 * Снимает cookie сессии (выход из аккаунта).
 *
 * Признаки должны совпадать с теми, с которыми cookie ставилась, иначе
 * браузер посчитает это другой cookie и старая останется на месте.
 */
export function clearSessionCookie(req: Request, res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure(req),
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
