/**
 * Ручки игр. Проверка входящих данных — через zod: всё, что пришло от клиента,
 * считаем недоверенным и приводим к нужному виду до попадания в логику.
 */

import { Router } from 'express';
import { z } from 'zod';

import { MAX_DIFFICULTY, GAME_TYPES, type Difficulty, type GameType } from '@colormemo/shared';

import { currentUserId } from '../auth/session';
import type { GamesService } from './service';

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'цвет должен быть в формате #rrggbb')
  .transform((value) => value.toLowerCase());

const startTaskSchema = z.object({
  gameType: z.enum(GAME_TYPES),
  // Верхнюю границу держим по MAX_DIFFICULTY: пока план-минимум, недоступные
  // уровни нельзя получить, подправив запрос вручную.
  difficulty: z.coerce.number().int().min(1).max(MAX_DIFFICULTY),
});

const submitAnswerSchema = z
  .object({
    taskId: z.string().min(1),
    responseTimeMs: z.coerce.number().int().min(0).max(600_000),
    pickedColor: hex.optional(),
    pickedSequence: z.array(hex).min(1).max(12).optional(),
  })
  .refine((body) => body.pickedColor !== undefined || body.pickedSequence !== undefined, {
    message: 'нужно передать pickedColor или pickedSequence',
  });

export function gamesRouter(games: GamesService): Router {
  const router = Router();

  router.post('/task', async (req, res, next) => {
    try {
      const body = startTaskSchema.parse(req.body);
      // Гость тоже может играть, просто его результат никуда не попадёт:
      // userId останется null, и в статистику задание не войдёт.
      const task = await games.createTask(
        body.gameType as GameType,
        body.difficulty as Difficulty,
        currentUserId(req),
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  router.post('/answer', async (req, res, next) => {
    try {
      const body = submitAnswerSchema.parse(req.body);
      const result = await games.submitAnswer(body, currentUserId(req));
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
