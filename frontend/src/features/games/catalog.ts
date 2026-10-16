/**
 * Каталог игр для экрана выбора.
 *
 * Состав плана-минимум взят из лабы 4: обязательны две игры —
 * «Выбери цвет» и «Повтори цвет». Остальные относятся к плану-максимум
 * и показываются как запланированные, чтобы экран выбора не приходилось
 * переделывать при их добавлении.
 */

import { GAME_TITLES, type GameType } from '@colormemo/shared';

import { GAME_SLUGS, type GameSlug } from '../../routes';

export type GameStatus = 'ready' | 'inProgress' | 'planned';

export interface GameCard {
  slug: GameSlug;
  gameType: GameType;
  title: string;
  description: string;
  status: GameStatus;
  /** Входит ли в обязательную минимальную версию по лабе 4 */
  required: boolean;
}

export const GAME_CATALOG: GameCard[] = [
  {
    slug: 'choose-color',
    gameType: GAME_SLUGS['choose-color'],
    title: GAME_TITLES.COLOR_CHOICE,
    description: 'Запомните цвет и найдите его среди похожих оттенков',
    status: 'inProgress',
    required: true,
  },
  {
    slug: 'repeat-color',
    gameType: GAME_SLUGS['repeat-color'],
    title: GAME_TITLES.COLOR_RECALL,
    description: 'Запомните цвет и подберите его заново',
    status: 'ready',
    required: true,
  },
  {
    slug: 'repeat-sequence',
    gameType: GAME_SLUGS['repeat-sequence'],
    title: GAME_TITLES.COLOR_SEQUENCE,
    description: 'Запомните порядок цветов и повторите его',
    status: 'planned',
    required: false,
  },
];

export const STATUS_LABELS: Record<GameStatus, string> = {
  ready: 'Доступна',
  inProgress: 'В разработке',
  planned: 'Запланирована',
};

export function findGameBySlug(slug: string | undefined): GameCard | null {
  return GAME_CATALOG.find((game) => game.slug === slug) ?? null;
}
