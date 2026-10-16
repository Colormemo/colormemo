/**
 * Тесты на цветовую математику. Запуск: npm test (из packages/shared)
 *
 * Это не формальность: если генерация вариантов сломается, игра станет
 * либо нерешаемой, либо тривиальной, и заметить это глазами трудно.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  colorAccuracy,
  colorAtDeltaE,
  colorDifference,
  makeChoiceOptions,
  makeSequence,
  normalizeHex,
  randomTargetColor,
  readableTextColor,
} from './color';
import { scoreAnswer, sequenceAccuracy } from './scoring';
import type { ColorSequenceTask, ColorRecallTask } from './games';

test('одинаковые цвета дают 100% точности', () => {
  assert.equal(colorAccuracy('#3355cc', '#3355cc'), 100);
});

test('противоположные цвета дают 0%', () => {
  assert.equal(colorAccuracy('#000000', '#ffffff'), 0);
});

test('чуть отличающийся оттенок оценивается высоко, но не в 100%', () => {
  const accuracy = colorAccuracy('#3355cc', '#3a5ac9');
  assert.ok(accuracy > 90, `ожидали больше 90%, получили ${accuracy}`);
  assert.ok(accuracy < 100, `ожидали меньше 100%, получили ${accuracy}`);
});

test('оценка перцептивная, а не по RGB: равный сдвиг RGB у синего и жёлтого оценивается по-разному', () => {
  // сдвигаем синий канал на 40 у синего и у жёлтого цвета
  const blueAccuracy = colorAccuracy('#0000c0', '#0000e8');
  const yellowAccuracy = colorAccuracy('#c0c000', '#c0c028');
  assert.notEqual(
    blueAccuracy,
    yellowAccuracy,
    'если оценки совпали, значит считается по RGB — это ошибка',
  );
});

test('случайный цвет не оказывается почти серым или почти чёрным', () => {
  for (let i = 0; i < 200; i += 1) {
    const color = randomTargetColor();
    const toBlack = colorDifference(color, '#000000');
    const toGray = colorDifference(color, '#808080');
    assert.ok(toBlack > 20, `слишком тёмный цвет: ${color}`);
    assert.ok(toGray > 8, `слишком серый цвет: ${color}`);
  }
});

test('colorAtDeltaE выдаёт цвет с запрошенной разницей', () => {
  for (const wanted of [2, 5, 10, 25]) {
    for (let i = 0; i < 30; i += 1) {
      const base = randomTargetColor();
      const got = colorAtDeltaE(base, wanted);
      const actual = colorDifference(base, got);
      assert.ok(
        Math.abs(actual - wanted) < wanted * 0.5 + 1,
        `хотели Delta E ${wanted}, получили ${actual.toFixed(2)} (${base} -> ${got})`,
      );
    }
  }
});

test('варианты ответа: нужное количество, есть правильный, нет повторов', () => {
  for (let i = 0; i < 50; i += 1) {
    const target = randomTargetColor();
    const options = makeChoiceOptions(target, 6, 6);

    assert.equal(options.length, 6, 'не хватило вариантов');
    assert.ok(options.includes(normalizeHex(target)), 'правильного варианта нет в списке');
    assert.equal(new Set(options).size, options.length, 'варианты повторяются');
  }
});

test('последовательность: нужная длина и цвета различимы между собой', () => {
  for (let i = 0; i < 40; i += 1) {
    const sequence = makeSequence(5, 15);
    assert.equal(sequence.length, 5);

    for (let a = 0; a < sequence.length; a += 1) {
      for (let b = a + 1; b < sequence.length; b += 1) {
        const d = colorDifference(sequence[a], sequence[b]);
        assert.ok(d >= 14, `цвета слишком похожи: ${sequence[a]} и ${sequence[b]}, Delta E ${d}`);
      }
    }
  }
});

test('точность последовательности считается по позициям с частичным зачётом', () => {
  const correct = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
  assert.equal(sequenceAccuracy(correct, correct), 100);
  assert.equal(sequenceAccuracy(correct, ['#ff0000', '#00ff00', '#ffff00', '#0000ff']), 50);
  assert.equal(sequenceAccuracy(correct, ['#ffff00', '#0000ff', '#00ff00', '#ff0000']), 0);
});

test('очки растут с точностью и со сложностью', () => {
  const task = (difficulty: 1 | 2): ColorRecallTask => ({
    attemptId: 'test',
    gameType: 'COLOR_RECALL',
    difficulty,
    showTimeMs: 2000,
    targetColor: '#3355cc',
  });

  const perfectEasy = scoreAnswer(task(1), {
    attemptId: 'test',
    gameType: 'COLOR_RECALL',
    pickedColor: '#3355cc',
    responseTimeMs: 1000,
  });
  const perfectHard = scoreAnswer(task(2), {
    attemptId: 'test',
    gameType: 'COLOR_RECALL',
    pickedColor: '#3355cc',
    responseTimeMs: 1000,
  });
  const sloppyEasy = scoreAnswer(task(1), {
    attemptId: 'test',
    gameType: 'COLOR_RECALL',
    pickedColor: '#7799ff',
    responseTimeMs: 1000,
  });

  assert.equal(perfectEasy.accuracy, 100);
  assert.ok(perfectHard.score > perfectEasy.score, 'сложный уровень должен давать больше очков');
  assert.ok(sloppyEasy.score < perfectEasy.score, 'неточный ответ должен давать меньше очков');
});

test('в «Выбери цвет» зачёт только за точное попадание', () => {
  const task = {
    attemptId: 'test',
    gameType: 'COLOR_CHOICE' as const,
    difficulty: 1 as const,
    showTimeMs: 3000,
    targetColor: '#3355cc',
    options: ['#3355cc', '#3a5ac9'],
  };

  const hit = scoreAnswer(task, {
    attemptId: 'test',
    gameType: 'COLOR_CHOICE',
    pickedColor: '#3355CC',
    responseTimeMs: 500,
  });
  const miss = scoreAnswer(task, {
    attemptId: 'test',
    gameType: 'COLOR_CHOICE',
    pickedColor: '#3a5ac9',
    responseTimeMs: 500,
  });

  assert.equal(hit.accuracy, 100, 'регистр в HEX не должен влиять на проверку');
  assert.equal(miss.accuracy, 0);
  assert.equal(miss.score, 0);
});

test('подпись поверх цвета выбирается читаемой', () => {
  assert.equal(readableTextColor('#ffffff'), '#000000');
  assert.equal(readableTextColor('#101010'), '#ffffff');
});

test('несовпадение типа игры в задании и ответе — это ошибка', () => {
  const task: ColorSequenceTask = {
    attemptId: 'test',
    gameType: 'COLOR_SEQUENCE',
    difficulty: 1,
    showTimeMs: 900,
    sequence: ['#ff0000', '#00ff00'],
  };

  assert.throws(() =>
    scoreAnswer(task, {
      attemptId: 'test',
      gameType: 'COLOR_RECALL',
      pickedColor: '#ff0000',
      responseTimeMs: 100,
    }),
  );
});
