/**
 * Хранение паролей.
 *
 * Пароль никогда не сохраняется и не логируется — в базу уходит только
 * результат scrypt. scrypt взят из node:crypto, без внешних библиотек:
 * он специально сделан медленным и требовательным к памяти, поэтому перебор
 * украденной базы обходится дорого. Обычный sha256 для паролей не годится
 * ровно потому, что он быстрый.
 *
 * Почему не argon2: это нативный модуль, который на Windows требует
 * установленных средств сборки. Насте пришлось бы ставить их отдельно,
 * а выигрыш для учебного проекта нулевой.
 *
 * Формат записи: scrypt$N$r$p$соль$хеш — параметры хранятся рядом с хешем,
 * чтобы их можно было поднять позже, не ломая уже заведённые аккаунты.
 */

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/** Параметры подбора. N — число итераций, r и p — память и параллельность. */
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

/** maxmem по умолчанию (32 МБ) не вмещает N=16384, поэтому задаём явно. */
const MAX_MEM = 64 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(password, salt, KEY_LENGTH, { ...PARAMS, maxmem: MAX_MEM });

  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
}

/**
 * Проверка пароля. Сравнение через timingSafeEqual: обычное === выходит
 * из сравнения на первом несовпавшем байте, и по времени ответа можно
 * подбирать хеш посимвольно.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');

  const derived = await scrypt(password, salt, expected.length, { N, r, p, maxmem: MAX_MEM });

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
