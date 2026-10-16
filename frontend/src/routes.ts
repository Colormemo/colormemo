/**
 * Адреса страниц в одном месте.
 *
 * Зачем так: адрес страницы встречается в роутере, в навигации и в ссылках
 * внутри страниц. Если писать строки руками, при переименовании раздела
 * часть ссылок останется старой и приведёт на «страница не найдена».
 * Здесь же опечатку поймает редактор.
 *
 * Задача 32 по лабе 4 (структура клиентского приложения и маршрутизация).
 */

import type { GameType } from '@colormemo/shared';

export const ROUTES = {
  home: '/',
  games: '/games',
  /** Шаблон для роутера */
  gamePattern: '/games/:gameSlug',
  login: '/login',
  register: '/register',
  profile: '/profile',
  stats: '/stats',
} as const;

/**
 * Человекочитаемые части адреса для игр.
 * В адресе не хотим технические COLOR_CHOICE, поэтому держим пару
 * «адрес — вид игры» и переводим в обе стороны.
 */
export const GAME_SLUGS = {
  'choose-color': 'COLOR_CHOICE',
  'repeat-color': 'COLOR_RECALL',
  'repeat-sequence': 'COLOR_SEQUENCE',
} as const satisfies Record<string, GameType>;

export type GameSlug = keyof typeof GAME_SLUGS;

/** Адрес страницы конкретной игры. */
export function gamePath(slug: GameSlug): string {
  return `${ROUTES.games}/${slug}`;
}

/** Вид игры по части адреса. null, если такой игры нет. */
export function gameTypeFromSlug(slug: string | undefined): GameType | null {
  if (!slug) return null;
  return slug in GAME_SLUGS ? GAME_SLUGS[slug as GameSlug] : null;
}
