/**
 * Ручки статистики. Обе требуют входа: статистика привязана к аккаунту,
 * у гостя её просто нет.
 */

import { Router } from 'express';
import { z } from 'zod';

import { HISTORY_LIMIT } from '@colormemo/shared';

import { AuthError } from '../auth/service';
import { currentUserId } from '../auth/session';
import type { StatsService } from './service';

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(HISTORY_LIMIT),
});

export function statsRouter(stats: StatsService): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const userId = currentUserId(req);
      if (!userId) throw new AuthError('Статистика доступна после входа', 401);

      res.json(await stats.overview(userId));
    } catch (error) {
      next(error);
    }
  });

  router.get('/history', async (req, res, next) => {
    try {
      const userId = currentUserId(req);
      if (!userId) throw new AuthError('История доступна после входа', 401);

      const { limit } = historyQuerySchema.parse(req.query);
      res.json(await stats.history(userId, limit));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
