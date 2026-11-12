/**
 * Регистрация и вход. Задача 33 по лабе 4.
 *
 * Про Express и про базу этот файл не знает: на входе логин и пароль,
 * на выходе публичные данные пользователя или ошибка с кодом ответа.
 */

import { validateLogin, validatePassword, type PublicUser } from '@colormemo/shared';

import type { UserRecord, UserRepository } from '../games/repository';
import { hashPassword, verifyPassword } from './password';

/** Ошибка, которую слой Express переводит в нужный код ответа. */
export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export class AuthService {
  constructor(private readonly repo: UserRepository) {}

  async register(login: string, password: string): Promise<PublicUser> {
    const trimmed = login.trim();

    const loginProblem = validateLogin(trimmed);
    if (loginProblem) throw new AuthError(loginProblem, 400);

    const passwordProblem = validatePassword(password);
    if (passwordProblem) throw new AuthError(passwordProblem, 400);

    const existing = await this.repo.findUserByLogin(trimmed);
    if (existing) throw new AuthError('Такой логин уже занят', 409);

    const user = await this.repo.createUser(trimmed, await hashPassword(password));
    return toPublicUser(user);
  }

  async login(login: string, password: string): Promise<PublicUser> {
    const user = await this.repo.findUserByLogin(login.trim());

    /*
     * Если логина нет, пароль всё равно «проверяем» — по заведомо негодному
     * хешу. Иначе ответ на несуществующий логин приходит заметно быстрее,
     * чем на существующий с неверным паролем, и по времени ответа можно
     * узнать, какие логины зарегистрированы.
     */
    const hash = user?.passwordHash ?? FAKE_HASH;
    const ok = await verifyPassword(password, hash);

    // Текст ошибки один на оба случая — по той же причине.
    if (!user || !ok) throw new AuthError('Неверный логин или пароль', 401);

    return toPublicUser(user);
  }

  /** Данные текущего пользователя по id из токена. */
  async me(userId: string): Promise<PublicUser | null> {
    const user = await this.repo.findUserById(userId);
    return user ? toPublicUser(user) : null;
  }
}

/**
 * Хеш-пустышка для случая «логина нет». Пароль от него никому не известен:
 * это просто строка нужного формата, на которой scrypt отработает столько же
 * времени, сколько и на настоящей записи.
 */
const FAKE_HASH =
  'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

/** Наружу уходит только то, что можно показывать: ни пароля, ни хеша. */
function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    login: user.login,
    createdAt: user.createdAt.toISOString(),
  };
}
