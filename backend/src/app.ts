import fs from 'node:fs';
import path from 'node:path';

import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';

import { gamesRouter } from './games/routes';
import { GameError, GamesService } from './games/service';
import type { TaskRepository } from './games/repository';

export interface AppOptions {
  repo: TaskRepository;
  /** Папка с собранным фронтом. Пустая строка или отсутствующая папка — только API. */
  clientDir?: string;
}

/**
 * Собирает приложение. Зависимости передаются снаружи, поэтому в тестах
 * подставляется хранилище в памяти и никакой базы не требуется.
 */
export function createApp({ repo, clientDir = '' }: AppOptions): Express {
  const app = express();

  app.use(express.json({ limit: '32kb' }));
  // TODO (Настя): для авторизации понадобится чтение cookie.
  // Добавь cookie-parser вместе с @types/cookie-parser той же мажорной версии,
  // что и @types/express, иначе типы обработчиков не сойдутся.

  // --- API ---------------------------------------------------------------
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/games', gamesRouter(new GamesService(repo)));

  // TODO (Настя): app.use('/api/auth', authRouter(...)) и app.use('/api/stats', ...).
  // Типы запросов и ответов уже описаны в packages/shared/src/api.ts.

  // Неизвестная ручка API должна отвечать JSON, а не страницей фронта.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Такой ручки нет' });
  });

  // --- Фронт на том же домене --------------------------------------------
  // Порядок важен: сначала API, потом статика. Иначе запрос к /api/...
  // будет отдан как index.html, и клиент получит HTML вместо JSON.
  const hasClient = clientDir !== '' && fs.existsSync(path.join(clientDir, 'index.html'));

  if (hasClient) {
    app.use(express.static(clientDir, { index: false }));

    // Любой адрес, не начинающийся с /api, отдаём как index.html —
    // тогда при перезагрузке страницы на вложенном адресе фронт не ломается.
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  }

  // --- Обработка ошибок ---------------------------------------------------
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Некорректные данные запроса',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    if (error instanceof GameError) {
      res.status(error.status).json({ error: error.message });
      return;
    }

    console.error('Необработанная ошибка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  });

  return app;
}
