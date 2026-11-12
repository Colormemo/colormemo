/**
 * Ручки авторизации: регистрация, вход, выход и «кто я сейчас».
 *
 * Всё, что пришло от клиента, проходит через zod: длины и допустимые символы
 * проверяются до того, как значения попадут в логику и в базу.
 */

import { Router } from 'express';
import { z } from 'zod';

import {
  LOGIN_MAX_LENGTH,
  LOGIN_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type AuthResponse,
} from '@colormemo/shared';

import { AuthError, type AuthService } from './service';
import { clearSessionCookie, currentUserId, setSessionCookie } from './session';

const credentialsSchema = z.object({
  login: z.string().min(LOGIN_MIN_LENGTH).max(LOGIN_MAX_LENGTH),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

export function authRouter(auth: AuthService): Router {
  const router = Router();

  router.post('/register', async (req, res, next) => {
    try {
      const body = credentialsSchema.parse(req.body);
      const user = await auth.register(body.login, body.password);

      // После регистрации сразу пускаем внутрь: отдельный вход не нужен.
      setSessionCookie(req, res, user.id);
      res.status(201).json({ user } satisfies AuthResponse);
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const body = credentialsSchema.parse(req.body);
      const user = await auth.login(body.login, body.password);

      setSessionCookie(req, res, user.id);
      res.json({ user } satisfies AuthResponse);
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', (req, res) => {
    clearSessionCookie(req, res);
    res.status(204).end();
  });

  router.get('/me', async (req, res, next) => {
    try {
      const userId = currentUserId(req);
      if (!userId) throw new AuthError('Вы не вошли в аккаунт', 401);

      const user = await auth.me(userId);

      /*
       * Токен подписан, но пользователя уже нет — например, аккаунт удалили,
       * а вкладка осталась открытой. Снимаем cookie, чтобы фронт не ходил
       * с мёртвой сессией до истечения срока.
       */
      if (!user) {
        clearSessionCookie(req, res);
        throw new AuthError('Вы не вошли в аккаунт', 401);
      }

      res.json({ user } satisfies AuthResponse);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
