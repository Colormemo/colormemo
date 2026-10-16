/**
 * Тесты игровой логики через настоящие ручки API.
 * База не нужна: хранилище подставляется в памяти.
 *
 * Запуск: npm test -w backend
 */

import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import request from 'supertest';
import type { Express } from 'express';

import { colorDifference, CHOICE_LEVELS, RECALL_LEVELS } from '@colormemo/shared';

import { createApp } from '../app';
import { MemoryTaskRepository } from './memory.repository';

let app: Express;

beforeEach(() => {
  app = createApp({ repo: new MemoryTaskRepository() });
});

test('health отвечает', async () => {
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.status, 'ok');
});

test('выдаёт задание «Повтори цвет» с параметрами своего уровня', async () => {
  const response = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_RECALL', difficulty: 2 })
    .expect(200);

  assert.equal(response.body.gameType, 'COLOR_RECALL');
  assert.equal(response.body.difficulty, 2);
  assert.equal(response.body.showTimeMs, RECALL_LEVELS[2].showTimeMs);
  assert.match(response.body.targetColor, /^#[0-9a-f]{6}$/);
  assert.ok(response.body.attemptId);
});

test('выдаёт задание «Выбери цвет» с нужным числом вариантов, один из них верный', async () => {
  const response = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_CHOICE', difficulty: 1 })
    .expect(200);

  const { targetColor, options } = response.body;
  assert.equal(options.length, CHOICE_LEVELS[1].optionCount);
  assert.ok(options.includes(targetColor), 'верного варианта нет среди предложенных');
  assert.equal(new Set(options).size, options.length, 'варианты повторяются');
});

test('выдаёт последовательность различимых цветов', async () => {
  const response = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_SEQUENCE', difficulty: 1 })
    .expect(200);

  const sequence: string[] = response.body.sequence;
  assert.equal(sequence.length, 3);

  for (let a = 0; a < sequence.length; a += 1) {
    for (let b = a + 1; b < sequence.length; b += 1) {
      assert.ok(
        colorDifference(sequence[a], sequence[b]) > 14,
        `цвета слишком похожи: ${sequence[a]} и ${sequence[b]}`,
      );
    }
  }
});

test('точный ответ даёт 100% и очки', async () => {
  const task = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_RECALL', difficulty: 1 })
    .expect(200);

  const result = await request(app)
    .post('/api/games/answer')
    .send({
      taskId: task.body.attemptId,
      pickedColor: task.body.targetColor,
      responseTimeMs: 1500,
    })
    .expect(200);

  assert.equal(result.body.accuracy, 100);
  assert.ok(result.body.score > 0);
  assert.equal(result.body.correct.color, task.body.targetColor);
  assert.equal(result.body.given.color, task.body.targetColor);
});

test('регистр в HEX не влияет на проверку', async () => {
  const task = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_CHOICE', difficulty: 1 })
    .expect(200);

  const result = await request(app)
    .post('/api/games/answer')
    .send({
      taskId: task.body.attemptId,
      pickedColor: String(task.body.targetColor).toUpperCase(),
      responseTimeMs: 800,
    })
    .expect(200);

  assert.equal(result.body.accuracy, 100);
});

test('на сложном уровне очков больше за тот же ответ', async () => {
  const play = async (difficulty: number) => {
    const task = await request(app)
      .post('/api/games/task')
      .send({ gameType: 'COLOR_RECALL', difficulty })
      .expect(200);

    const result = await request(app)
      .post('/api/games/answer')
      .send({
        taskId: task.body.attemptId,
        pickedColor: task.body.targetColor,
        responseTimeMs: 1000,
      })
      .expect(200);

    return result.body.score as number;
  };

  assert.ok((await play(2)) > (await play(1)));
});

test('повторно ответить на то же задание нельзя', async () => {
  const task = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_RECALL', difficulty: 1 })
    .expect(200);

  const answer = {
    taskId: task.body.attemptId,
    pickedColor: '#123456',
    responseTimeMs: 1000,
  };

  await request(app).post('/api/games/answer').send(answer).expect(200);
  await request(app).post('/api/games/answer').send(answer).expect(409);
});

test('ответ на несуществующее задание — 404', async () => {
  await request(app)
    .post('/api/games/answer')
    .send({ taskId: 'нет такого', pickedColor: '#123456', responseTimeMs: 100 })
    .expect(404);
});

test('недоступный уровень сложности отклоняется', async () => {
  // План-минимум — два уровня, пятый пока нельзя запросить правкой запроса
  await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_RECALL', difficulty: 5 })
    .expect(400);
});

test('неизвестная игра отклоняется', async () => {
  await request(app)
    .post('/api/games/task')
    .send({ gameType: 'GUESS_SHAPES', difficulty: 1 })
    .expect(400);
});

test('цвет не в формате #rrggbb отклоняется', async () => {
  const task = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_RECALL', difficulty: 1 })
    .expect(200);

  const response = await request(app)
    .post('/api/games/answer')
    .send({ taskId: task.body.attemptId, pickedColor: 'красный', responseTimeMs: 100 })
    .expect(400);

  assert.ok(Array.isArray(response.body.details));
});

test('ответ без выбранного цвета и без последовательности отклоняется', async () => {
  const task = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_RECALL', difficulty: 1 })
    .expect(200);

  await request(app)
    .post('/api/games/answer')
    .send({ taskId: task.body.attemptId, responseTimeMs: 100 })
    .expect(400);
});

test('на последовательность нельзя ответить одним цветом', async () => {
  const task = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_SEQUENCE', difficulty: 1 })
    .expect(200);

  await request(app)
    .post('/api/games/answer')
    .send({ taskId: task.body.attemptId, pickedColor: '#123456', responseTimeMs: 100 })
    .expect(400);
});

test('частичный зачёт в последовательности: перепутанные местами цвета', async () => {
  const task = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_SEQUENCE', difficulty: 1 })
    .expect(200);

  const sequence: string[] = task.body.sequence;
  const swapped = [sequence[1], sequence[0], sequence[2]];

  const result = await request(app)
    .post('/api/games/answer')
    .send({ taskId: task.body.attemptId, pickedSequence: swapped, responseTimeMs: 2000 })
    .expect(200);

  // один цвет из трёх на своём месте
  assert.ok(result.body.accuracy > 30 && result.body.accuracy < 40, `получили ${result.body.accuracy}`);
});

test('неизвестная ручка API отвечает JSON, а не страницей', async () => {
  const response = await request(app).post('/api/nope').send({}).expect(404);
  assert.equal(response.body.error, 'Такой ручки нет');
});

test('время ответа вне разумных границ отклоняется', async () => {
  const task = await request(app)
    .post('/api/games/task')
    .send({ gameType: 'COLOR_RECALL', difficulty: 1 })
    .expect(200);

  await request(app)
    .post('/api/games/answer')
    .send({
      taskId: task.body.attemptId,
      pickedColor: '#123456',
      responseTimeMs: -5,
    })
    .expect(400);
});
