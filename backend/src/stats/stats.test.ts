/**
 * Тесты сохранения результатов, истории и статистики. Задачи 37–39 по лабе 4.
 */

import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import request from 'supertest';
import type { Express } from 'express';
import type TestAgent from 'supertest/lib/agent';

import { createApp } from '../app';
import { MemoryRepository } from '../games/memory.repository';

let app: Express;

const CREDENTIALS = { login: 'masha', password: 'colormemo2026' };

beforeEach(() => {
  app = createApp({ repo: new MemoryRepository() });
});

/** Заводит игрока и возвращает «браузер» с его сессией. */
async function signedIn(): Promise<TestAgent> {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(CREDENTIALS).expect(201);
  return agent;
}

/** Проходит один раунд целиком. accuracy=100, если отвечать верно. */
async function playRound(
  agent: TestAgent | typeof request,
  gameType: string,
  difficulty: number,
  correct = true,
) {
  const client = agent as TestAgent;

  const task = await client.post('/api/games/task').send({ gameType, difficulty }).expect(200);

  const picked = correct ? task.body.targetColor : '#000000';

  const result = await client
    .post('/api/games/answer')
    .send({ taskId: task.body.attemptId, pickedColor: picked, responseTimeMs: 1200 })
    .expect(200);

  return result.body;
}

// --- Доступ ----------------------------------------------------------------

test('статистика и история требуют входа', async () => {
  await request(app).get('/api/stats').expect(401);
  await request(app).get('/api/stats/history').expect(401);
});

test('у нового игрока статистика пустая, но не ошибка', async () => {
  const agent = await signedIn();

  const stats = await agent.get('/api/stats').expect(200);
  assert.equal(stats.body.totalAttempts, 0);
  assert.equal(stats.body.totalScore, 0);
  assert.deepEqual(stats.body.byGame, []);

  const history = await agent.get('/api/stats/history').expect(200);
  assert.deepEqual(history.body.entries, []);
});

// --- Сохранение результатов ------------------------------------------------

test('пройденные раунды попадают в статистику игрока', async () => {
  const agent = await signedIn();

  await playRound(agent, 'COLOR_RECALL', 1);
  await playRound(agent, 'COLOR_RECALL', 1);
  await playRound(agent, 'COLOR_CHOICE', 2);

  const stats = await agent.get('/api/stats').expect(200);

  assert.equal(stats.body.totalAttempts, 3);
  assert.ok(stats.body.totalScore > 0);
  assert.equal(stats.body.averageAccuracy, 100);

  // Разные игры и разные уровни считаются отдельно.
  assert.equal(stats.body.byGame.length, 2);

  const recall = stats.body.byGame.find(
    (row: { gameType: string; difficulty: number }) =>
      row.gameType === 'COLOR_RECALL' && row.difficulty === 1,
  );
  assert.equal(recall.attempts, 2);
  assert.equal(recall.averageAccuracy, 100);
  assert.equal(recall.recentScores.length, 2);
});

test('промахи снижают среднюю точность', async () => {
  const agent = await signedIn();

  await playRound(agent, 'COLOR_CHOICE', 1, true);
  await playRound(agent, 'COLOR_CHOICE', 1, false);

  const stats = await agent.get('/api/stats').expect(200);

  // В «Выбери цвет» зачёт двоичный: 100 и 0 дают среднее 50.
  assert.equal(stats.body.averageAccuracy, 50);
  assert.equal(stats.body.byGame[0].attempts, 2);
});

test('игра без входа в статистику не попадает', async () => {
  const guest = request.agent(app);
  await playRound(guest, 'COLOR_RECALL', 1);

  const agent = await signedIn();
  const stats = await agent.get('/api/stats').expect(200);

  assert.equal(stats.body.totalAttempts, 0);
});

test('игроки не видят результаты друг друга', async () => {
  const masha = await signedIn();
  await playRound(masha, 'COLOR_RECALL', 1);

  const nastya = request.agent(app);
  await nastya
    .post('/api/auth/register')
    .send({ login: 'nastya', password: 'colormemo2026' })
    .expect(201);

  const stats = await nastya.get('/api/stats').expect(200);
  assert.equal(stats.body.totalAttempts, 0);
});

// --- Рекорды ---------------------------------------------------------------

test('первый результат — рекорд, результат хуже — нет', async () => {
  const agent = await signedIn();

  const first = await playRound(agent, 'COLOR_CHOICE', 1, true);
  assert.equal(first.isRecord, true);

  const worse = await playRound(agent, 'COLOR_CHOICE', 1, false);
  assert.equal(worse.isRecord, false);
});

// --- История ---------------------------------------------------------------

test('история отдаёт последние попытки, новые первыми', async () => {
  const agent = await signedIn();

  await playRound(agent, 'COLOR_RECALL', 1);
  await playRound(agent, 'COLOR_CHOICE', 2);

  const history = await agent.get('/api/stats/history').expect(200);

  assert.equal(history.body.entries.length, 2);
  assert.equal(history.body.entries[0].gameType, 'COLOR_CHOICE');
  assert.equal(history.body.entries[1].gameType, 'COLOR_RECALL');

  const entry = history.body.entries[0];
  assert.equal(entry.difficulty, 2);
  assert.equal(entry.accuracy, 100);
  assert.ok(entry.score > 0);
  assert.ok(Date.parse(entry.playedAt) > 0, 'дата попытки нечитаемая');
});

test('история ограничивается запрошенным числом записей', async () => {
  const agent = await signedIn();

  await playRound(agent, 'COLOR_RECALL', 1);
  await playRound(agent, 'COLOR_RECALL', 1);
  await playRound(agent, 'COLOR_RECALL', 1);

  const history = await agent.get('/api/stats/history?limit=2').expect(200);
  assert.equal(history.body.entries.length, 2);
});

test('бессмысленный limit отклоняется', async () => {
  const agent = await signedIn();
  await agent.get('/api/stats/history?limit=0').expect(400);
  await agent.get('/api/stats/history?limit=500').expect(400);
});
