/**
 * Токен сессии.
 *
 * Внутри — тот же приём, что и в JWT: открытая часть с идентификатором
 * пользователя и сроком годности плюс подпись HMAC-SHA256. Подделать токен
 * нельзя, не зная секрет, а прочитать его может кто угодно — поэтому ничего,
 * кроме id и срока, туда не кладётся.
 *
 * Своя реализация вместо библиотеки: нужен ровно один алгоритм подписи,
 * это два десятка строк на node:crypto, и зависимостей в проекте меньше.
 *
 * Токен уезжает в httpOnly-cookie: JavaScript страницы до неё не дотянется,
 * поэтому чужой скрипт не сможет её прочитать и увести сессию.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'colormemo_session';

/** Сколько живёт сессия. Месяц: тренажёр открывают нерегулярно. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface Payload {
  /** id пользователя */
  uid: string;
  /** время истечения, мс эпохи */
  exp: number;
}

function base64url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(data: string, secret: string): string {
  return base64url(createHmac('sha256', secret).update(data).digest());
}

/** Создаёт токен для пользователя. */
export function createToken(userId: string, secret: string, now = Date.now()): string {
  const payload: Payload = { uid: userId, exp: now + SESSION_TTL_MS };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

/**
 * Проверяет токен и возвращает id пользователя.
 * null — если подпись не сходится, срок вышел или формат испорчен.
 */
export function readToken(token: string, secret: string, now = Date.now()): string | null {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = sign(body, secret);
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);

  // Длины сравниваем отдельно: timingSafeEqual падает на разных длинах.
  if (given.length !== want.length) return null;
  if (!timingSafeEqual(given, want)) return null;

  try {
    const payload = JSON.parse(fromBase64url(body).toString('utf8')) as Payload;
    if (typeof payload.uid !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp <= now) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

/**
 * Разбор заголовка Cookie.
 *
 * Отдельной библиотеки не берём: у cookie-parser и @types/express должны
 * совпадать мажорные версии типов, иначе обработчики Express перестают
 * сходиться по типам — на этом проект уже один раз спотыкался.
 */
export function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;

  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;

    const name = part.slice(0, eq).trim();
    if (!name) continue;

    const raw = part.slice(eq + 1).trim();
    try {
      result[name] = decodeURIComponent(raw);
    } catch {
      result[name] = raw;
    }
  }

  return result;
}
