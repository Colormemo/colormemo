/**
 * Тесты регистрации, входа и сессии. Задача 33 по лабе 4.
 * База не нужна: хранилище подставляется в памяти.
 *
 * request.agent(app) запоминает cookie между запросами — ведёт себя
 * как браузер, поэтому сессию можно проверять по-настоящему.
 */

import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import request from 'supertest';
import type { Express } from 'express';

import { createApp } from '../app';
import { MemoryRepository } from '../games/memory.repository';
import { hashPassword, verifyPassword } from './password';
import { createToken, readToken, parseCookies } from './token';

let app: Express;
let repo: MemoryRepository;

const CREDENTIALS = { login: 'masha', password: 'colormemo2026' };

beforeEach(() => {
  repo = new MemoryRepository();
  app = createApp({ repo });
});

// --- Пароль ----------------------------------------------------------------

test('верный пароль проходит проверку, неверный — нет', async () => {
  const hash = await hashPassword('colormemo2026');

  assert.equal(await verifyPassword('colormemo2026', hash), true);
  assert.equal(await verifyPassword('colormemo2027', hash), false);
});

test('одинаковые пароли дают разные хеши', async () => {
  const first = await hashPassword('colormemo2026');
  const second = await hashPassword('colormemo2026');

  // Соль у каждой записи своя, иначе по одинаковым хешам в базе было бы
  // видно, у кого совпадают пароли.
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('colormemo2026', second), true);
});

test('испорченная запись хеша не принимает никакой пароль', async () => {
  assert.equal(await verifyPassword('colormemo2026', 'мусор'), false);
  assert.equal(await verifyPassword('colormemo2026', ''), false);
});

// --- Токен -----------------------------------------------------------------

test('токен читается обратно, а подделанный — нет', () => {
  const token = createToken('user-1', 'секрет');

  assert.equal(readToken(token, 'секрет'), 'user-1');
  assert.equal(readToken(token, 'другой-секрет'), null, 'чужая подпись принята');
  assert.equal(readToken(`${token}x`, 'секрет'), null, 'испорченная подпись принята');
});

test('просроченный токен не принимается', () => {
  const token = createToken('user-1', 'секрет', Date.now());
  const muchLater = Date.now() + 400 * 24 * 60 * 60 * 1000;

  assert.equal(readToken(token, 'секрет', muchLater), null);
});

test('заголовок Cookie разбирается', () => {
  const cookies = parseCookies('a=1; colormemo_session=abc.def; empty=');

  assert.equal(cookies.a, '1');
  assert.equal(cookies.colormemo_session, 'abc.def');
  assert.equal(cookies.empty, '');
  assert.deepEqual(parseCookies(undefined), {});
});

// --- Регистрация -----------------------------------------------------------

test('регистрация создаёт пользователя и сразу открывает сессию', async () => {
  const agent = request.agent(app);

  const registered = await agent.post('/api/auth/register').send(CREDENTIALS).expect(201);
  assert.equal(registered.body.user.login, 'masha');
  assert.ok(registered.body.user.id);

  const me = await agent.get('/api/auth/me').expect(200);
  assert.equal(me.body.user.login, 'masha');
});

test('пароль наружу не отдаётся и в хранилище лежит только хеш', async () => {
  const response = await request(app).post('/api/auth/register').send(CREDENTIALS).expect(201);

  assert.equal(JSON.stringify(response.body).includes(CREDENTIALS.password), false);

  const stored = await repo.findUserByLogin('masha');
  assert.ok(stored);
  assert.notEqual(stored.passwordHash, CREDENTIALS.password);
  assert.equal(await verifyPassword(CREDENTIALS.password, stored.passwordHash), true);
});

test('cookie сессии недоступна скриптам страницы', async () => {
  const response = await request(app).post('/api/auth/register').send(CREDENTIALS).expect(201);

  const cookie = (response.headers['set-cookie'] as unknown as string[])[0];
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
});

test('по открытому соединению cookie без secure, за https-прокси — с ним', async () => {
  const plain = await request(app).post('/api/auth/register').send(CREDENTIALS).expect(201);
  const plainCookie = (plain.headers['set-cookie'] as unknown as string[])[0];

  // Локальная разработка идёт по http: с признаком secure браузер бы
  // cookie не принял и вход молча не сработал бы.
  assert.equal(/Secure/i.test(plainCookie), false);

  const behindProxy = await request(app)
    .post('/api/auth/login')
    .set('X-Forwarded-Proto', 'https')
    .send(CREDENTIALS)
    .expect(200);
  const proxyCookie = (behindProxy.headers['set-cookie'] as unknown as string[])[0];

  // За туннелем или хостингом до браузера соединение защищённое —
  // тогда cookie не должна ходить по открытому каналу.
  assert.match(proxyCookie, /Secure/i);
});

test('занятый логин отклоняется, в том числе в другом регистре', async () => {
  await request(app).post('/api/auth/register').send(CREDENTIALS).expect(201);

  await request(app).post('/api/auth/register').send(CREDENTIALS).expect(409);

  await request(app)
    .post('/api/auth/register')
    .send({ ...CREDENTIALS, login: 'MASHA' })
    .expect(409);
});

test('короткий пароль и недопустимый логин отклоняются', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ login: 'masha', password: '123' })
    .expect(400);

  await request(app)
    .post('/api/auth/register')
    .send({ login: 'маша', password: 'colormemo2026' })
    .expect(400);
});

// --- Вход ------------------------------------------------------------------

test('вход по верным данным открывает сессию', async () => {
  await request(app).post('/api/auth/register').send(CREDENTIALS).expect(201);

  const agent = request.agent(app);
  await agent.post('/api/auth/login').send(CREDENTIALS).expect(200);

  const me = await agent.get('/api/auth/me').expect(200);
  assert.equal(me.body.user.login, 'masha');
});

test('логин можно вводить в любом регистре', async () => {
  await request(app).post('/api/auth/register').send(CREDENTIALS).expect(201);

  await request(app)
    .post('/api/auth/login')
    .send({ ...CREDENTIALS, login: 'MaShA' })
    .expect(200);
});

test('неверный пароль и несуществующий логин дают одинаковый ответ', async () => {
  await request(app).post('/api/auth/register').send(CREDENTIALS).expect(201);

  const wrongPassword = await request(app)
    .post('/api/auth/login')
    .send({ login: 'masha', password: 'неверный-пароль' })
    .expect(401);

  const noSuchUser = await request(app)
    .post('/api/auth/login')
    .send({ login: 'nastya', password: 'colormemo2026' })
    .expect(401);

  // Разные тексты подсказали бы, какие логины существуют.
  assert.equal(wrongPassword.body.error, noSuchUser.body.error);
});

// --- Сессия ----------------------------------------------------------------

test('без входа /me отвечает 401', async () => {
  await request(app).get('/api/auth/me').expect(401);
});

test('выход закрывает сессию', async () => {
  const agent = request.agent(app);

  await agent.post('/api/auth/register').send(CREDENTIALS).expect(201);
  await agent.get('/api/auth/me').expect(200);

  await agent.post('/api/auth/logout').expect(204);
  await agent.get('/api/auth/me').expect(401);
});

test('подделанная cookie не пускает внутрь', async () => {
  await request(app).post('/api/auth/register').send(CREDENTIALS).expect(201);

  const user = await repo.findUserByLogin('masha');
  assert.ok(user);

  // Настоящий id, но подпись сделана чужим секретом.
  const forged = createToken(user.id, 'не-тот-секрет');

  await request(app).get('/api/auth/me').set('Cookie', `colormemo_session=${forged}`).expect(401);
});
