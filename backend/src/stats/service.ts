/**
 * Статистика и история прохождений. Задачи 38 и 39 по лабе 4.
 *
 * Агрегаты считаются в коде, а не запросом с GROUP BY. Причины:
 *   - данных одного игрока мало, выборка дешёвая;
 *   - одна и та же формула работает и на Postgres, и в режиме без базы,
 *     поэтому цифры в двух режимах не разойдутся;
 *   - средняя точность и «лучший результат» считаются там же, где их потом
 *     читать, — правку вносить в одном месте.
 */

import {
  HISTORY_LIMIT,
  type GameStats,
  type HistoryResponse,
  type StatsResponse,
} from '@colormemo/shared';

import type { AttemptRow, StatsRepository } from '../games/repository';

/** Сколько последних очков отдаём для графика прогресса. */
const RECENT_SCORES = 10;

export class StatsService {
  constructor(private readonly repo: StatsRepository) {}

  async overview(userId: string): Promise<StatsResponse> {
    const attempts = await this.repo.attempts(userId);

    // Группируем по паре «игра + сложность»: средняя точность на первом
    // уровне и на втором — разные величины, смешивать их нельзя.
    const groups = new Map<string, AttemptRow[]>();
    for (const row of attempts) {
      const key = `${row.gameType}:${row.difficulty}`;
      const group = groups.get(key);
      if (group) group.push(row);
      else groups.set(key, [row]);
    }

    const byGame: GameStats[] = [...groups.values()].map((rows) => {
      // В repo.attempts новые идут первыми, для графика нужен обратный порядок.
      const chronological = [...rows].reverse();

      return {
        gameType: rows[0].gameType,
        difficulty: rows[0].difficulty,
        attempts: rows.length,
        averageAccuracy: round1(average(rows.map((row) => row.accuracy))),
        bestScore: Math.max(...rows.map((row) => row.score)),
        recentScores: chronological.slice(-RECENT_SCORES).map((row) => row.score),
      };
    });

    // Порядок вывода делаем устойчивым, иначе карточки на экране статистики
    // будут прыгать местами от запроса к запросу.
    byGame.sort((a, b) =>
      a.gameType === b.gameType
        ? a.difficulty - b.difficulty
        : a.gameType.localeCompare(b.gameType),
    );

    return {
      totalAttempts: attempts.length,
      totalScore: attempts.reduce((sum, row) => sum + row.score, 0),
      averageAccuracy: round1(average(attempts.map((row) => row.accuracy))),
      byGame,
    };
  }

  async history(userId: string, limit = HISTORY_LIMIT): Promise<HistoryResponse> {
    const rows = await this.repo.attempts(userId, limit);

    return {
      entries: rows.map((row) => ({
        id: row.id,
        gameType: row.gameType,
        difficulty: row.difficulty,
        accuracy: row.accuracy,
        score: row.score,
        responseTimeMs: row.responseTimeMs,
        playedAt: row.playedAt.toISOString(),
      })),
    };
  }
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Один знак после запятой: точность вида 73.333333 на экране не нужна. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
