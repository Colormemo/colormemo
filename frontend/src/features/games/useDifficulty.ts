/**
 * Выбранный уровень сложности, общий для всех игр.
 *
 * Запоминаем его в браузере: человек, которому первый уровень уже лёгок,
 * иначе переключал бы сложность заново на каждом экране игры.
 *
 * Хранилище может быть недоступно — в приватном окне или при запрете
 * данных сайта, — поэтому и чтение, и запись обёрнуты: приложение должно
 * работать и без них, просто забывая выбор.
 */

import { useCallback, useState } from 'react';

import { MAX_DIFFICULTY, type Difficulty } from '@colormemo/shared';

const STORAGE_KEY = 'colormemo:difficulty';

function readStored(): Difficulty {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const value = Number(raw);

    if (Number.isInteger(value) && value >= 1 && value <= MAX_DIFFICULTY) {
      return value as Difficulty;
    }
  } catch {
    // недоступное хранилище — просто берём уровень по умолчанию
  }

  return 1;
}

export function useDifficulty(): [Difficulty, (value: Difficulty) => void] {
  const [difficulty, setDifficulty] = useState<Difficulty>(readStored);

  const change = useCallback((value: Difficulty) => {
    setDifficulty(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // выбор не сохранится, но игра работает — этого достаточно
    }
  }, []);

  return [difficulty, change];
}
