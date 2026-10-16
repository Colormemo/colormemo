/**
 * Работа с цветом: генерация заданий и подсчёт точности.
 *
 * ГЛАВНОЕ, ЧТО НУЖНО ПОНИМАТЬ
 *
 * Точность подбора цвета нельзя считать как расстояние между RGB. Глаз
 * воспринимает цвет нелинейно: у двух синих оттенков разница в 30 единиц RGB
 * почти незаметна, а у двух жёлтых с той же разницей — бросается в глаза.
 * Если считать по RGB, проценты будут несправедливыми и игра покажется
 * сломанной: подобрал «на глаз идеально» — получил 60%.
 *
 * Поэтому оба цвета переводятся в перцептивное пространство Lab и сравниваются
 * по формуле CIEDE2000 (Delta E 2000) — это отраслевой стандарт того,
 * «насколько два цвета различаются для человека».
 *
 * Ориентиры по Delta E:
 *   меньше 1  — разницу не видит почти никто
 *   1–2       — заметно при сравнении рядом
 *   2–5       — заметно сразу
 *   больше 10 — явно разные цвета
 *   около 100 — противоположности (чёрный и белый)
 */

import { converter, differenceCiede2000, formatHex, inGamut, parse } from 'culori';
import type { Hex } from './games';

const toLab = converter('lab');
const toHsl = converter('hsl');
const deltaE = differenceCiede2000();
const rgbInGamut = inGamut('rgb');

/**
 * При какой разнице цветов точность считается нулевой.
 * 50 по Delta E — это уже «совсем другой цвет».
 *
 * Это главный параметр честности игры. После тестирования на людях его
 * почти наверняка захочется покрутить: меньше значение — строже оценка.
 */
export const ZERO_ACCURACY_DELTA_E = 50;

/** Разница двух цветов по CIEDE2000. */
export function colorDifference(a: Hex, b: Hex): number {
  return deltaE(a, b);
}

/**
 * Точность подбора цвета в процентах, 0–100.
 *
 * Зависимость линейная — так игроку понятнее: «ошибся вдвое сильнее — потерял
 * вдвое больше процентов». Примеры при ZERO_ACCURACY_DELTA_E = 50:
 *   Delta E 0  -> 100%
 *   Delta E 2  -> 96%
 *   Delta E 5  -> 90%
 *   Delta E 15 -> 70%
 *   Delta E 25 -> 50%
 *   Delta E 50 и больше -> 0%
 */
export function colorAccuracy(target: Hex, picked: Hex): number {
  const d = colorDifference(target, picked);
  const raw = 100 * (1 - d / ZERO_ACCURACY_DELTA_E);
  return Math.round(Math.max(0, Math.min(100, raw)) * 10) / 10;
}

/** Приводим цвет к виду '#rrggbb' в нижнем регистре. */
export function normalizeHex(color: string): Hex {
  const parsed = parse(color);
  if (!parsed) throw new Error(`Не удалось разобрать цвет: ${color}`);
  return formatHex(parsed).toLowerCase();
}

// --------------------------------------------------------------------------
// Генерация цветов для заданий
// --------------------------------------------------------------------------

/**
 * Подменяемый генератор случайных чисел.
 * Нужен, чтобы в тестах получать предсказуемые цвета.
 */
export type Random = () => number;

const between = (rnd: Random, min: number, max: number) => min + rnd() * (max - min);

/**
 * Случайный цвет для задания.
 *
 * Насыщенность и светлота нарочно ограничены: без этого выпадают почти серые
 * и почти чёрные оттенки, которые невозможно ни запомнить, ни подобрать,
 * и игрок решает, что игра сломана.
 */
export function randomTargetColor(rnd: Random = Math.random): Hex {
  const h = between(rnd, 0, 360);
  const s = between(rnd, 0.4, 0.9);
  const l = between(rnd, 0.32, 0.7);
  return normalizeHex(formatHex({ mode: 'hsl', h, s, l })!);
}

/**
 * Цвет, отличающийся от базового примерно на заданную Delta E.
 *
 * Как работает: берём случайное направление в пространстве Lab и двоичным
 * поиском подбираем, насколько далеко по нему шагнуть, чтобы получить нужную
 * разницу.
 *
 * Тонкость, на которой легко ошибиться: часть направлений быстро выводит цвет
 * за пределы того, что способен показать экран (за границы sRGB). Если просто
 * обрезать шаг, подбор сойдётся к слишком маленькой разнице и варианты ответа
 * окажутся неразличимыми. Поэтому пробуем несколько случайных направлений и
 * оставляем то, которое ближе всего к нужной разнице.
 */
export function colorAtDeltaE(base: Hex, targetDelta: number, rnd: Random = Math.random): Hex {
  const lab = toLab(base)!;

  // Сначала случайные направления — они дают разнообразие оттенков.
  const directions: Array<[number, number, number]> = [];
  for (let i = 0; i < 10; i += 1) {
    const dl = between(rnd, -1, 1);
    const da = between(rnd, -1, 1);
    const db = between(rnd, -1, 1);
    const len = Math.hypot(dl, da, db) || 1;
    directions.push([dl / len, da / len, db / len]);
  }

  // Затем направления, которые из любой точки гарантированно ведут внутрь
  // экранного диапазона: темнее, светлее и в сторону серого. Нужны для
  // насыщенных цветов у границы sRGB, где случайные направления почти сразу
  // выходят за её пределы и большая разница оказывается недостижимой.
  const chroma = Math.hypot(lab.a, lab.b) || 1;
  directions.push([-1, 0, 0], [1, 0, 0]);
  directions.push([0, -lab.a / chroma, -lab.b / chroma]);
  directions.push([-0.7, (-0.7 * lab.a) / chroma, (-0.7 * lab.b) / chroma]);

  let best = base;
  let bestError = Number.POSITIVE_INFINITY;

  for (const [dl, da, db] of directions) {
    const at = (t: number) => ({
      mode: 'lab' as const,
      l: lab.l + dl * t,
      a: lab.a + da * t,
      b: lab.b + db * t,
    });

    let low = 0;
    let high = 120;

    for (let i = 0; i < 22; i += 1) {
      const mid = (low + high) / 2;
      const candidate = at(mid);
      const hex = formatHex(candidate);

      if (!hex || !rgbInGamut(candidate)) {
        high = mid; // вышли за границы экрана — шагаем ближе
        continue;
      }

      const d = deltaE(base, hex);
      const error = Math.abs(d - targetDelta);

      if (error < bestError) {
        bestError = error;
        best = normalizeHex(hex);
      }

      if (error < 0.15) break;
      if (d < targetDelta) low = mid;
      else high = mid;
    }

    // нашли достаточно точно — дальше перебирать направления смысла нет
    if (bestError < 0.3) break;
  }

  return best;
}

/**
 * Варианты ответа для игры «Выбери цвет»: правильный плюс похожие на него.
 * Возвращается перемешанный массив.
 */
export function makeChoiceOptions(
  target: Hex,
  count: number,
  distractorDeltaE: number,
  rnd: Random = Math.random,
): Hex[] {
  const options: Hex[] = [normalizeHex(target)];
  let guard = 0;

  while (options.length < count && guard < count * 60) {
    guard += 1;
    // немного разбрасываем сложность вокруг заданной, иначе все варианты
    // оказываются на одинаковом расстоянии и выбор превращается в лотерею
    const spread = distractorDeltaE * between(rnd, 0.8, 1.6);
    const candidate = colorAtDeltaE(target, spread, rnd);

    if (options.includes(candidate)) continue;
    // вариант не должен быть подозрительно близок к другому варианту
    if (options.some((o) => deltaE(o, candidate) < distractorDeltaE * 0.5)) continue;

    options.push(candidate);
  }

  return shuffle(options, rnd);
}

/**
 * Последовательность цветов для игры «Воспроизведи последовательность».
 * Цвета гарантированно различимы между собой, иначе задание нерешаемо.
 */
export function makeSequence(length: number, minDeltaE: number, rnd: Random = Math.random): Hex[] {
  const sequence: Hex[] = [];
  let guard = 0;

  while (sequence.length < length && guard < length * 200) {
    guard += 1;
    const candidate = randomTargetColor(rnd);
    if (sequence.some((c) => deltaE(c, candidate) < minDeltaE)) continue;
    sequence.push(candidate);
  }

  // страховка: если подобрать не удалось (слишком большой minDeltaE),
  // добираем цветами по кругу цветового круга
  while (sequence.length < length) {
    const h = (sequence.length * 360) / length;
    sequence.push(normalizeHex(formatHex({ mode: 'hsl', h, s: 0.7, l: 0.5 })!));
  }

  return sequence;
}

/** Перемешивание массива (алгоритм Фишера — Йетса). */
export function shuffle<T>(items: readonly T[], rnd: Random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Светлый или тёмный текст поверх цвета — чтобы подписи читались. */
export function readableTextColor(background: Hex): '#000000' | '#ffffff' {
  const { l } = toHsl(background)!;
  return (l ?? 0) > 0.55 ? '#000000' : '#ffffff';
}
