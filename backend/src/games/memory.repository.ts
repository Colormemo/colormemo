/**
 * Хранилище без Postgres.
 *
 * Два применения:
 *   - в тестах — без файла, всё живёт в памяти процесса и исчезает после;
 *   - в режиме `npm run dev:nodb` — с файлом, чтобы приложение целиком
 *     (регистрация, игры, профиль, статистика) работало на машине, где
 *     Docker не поднят. Записи переживают перезапуск сервера.
 *
 * Это не замена базе: файл не выдержит нескольких одновременных игроков
 * и не умеет откатывать незавершённые операции. Рабочее хранилище —
 * PostgreSQL через prisma.repository.ts, а это запасной путь для разработки
 * и демонстрации.
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import type { Difficulty, GameType } from '@colormemo/shared';

import type {
  AppRepository,
  AttemptRow,
  SaveResultInput,
  StoredTask,
  UserRecord,
} from './repository';

interface StoredResult extends SaveResultInput {
  id: string;
  createdAt: string;
}

/** Пользователь на диске: дата хранится строкой, как её отдаёт JSON. */
interface StoredUser extends Omit<UserRecord, 'createdAt'> {
  createdAt: string;
}

interface Snapshot {
  version: 1;
  tasks: StoredTask[];
  results: StoredResult[];
  users: StoredUser[];
}

export interface MemoryRepositoryOptions {
  /** Путь к файлу состояния. Без него данные живут только в памяти. */
  filePath?: string;
}

export class MemoryRepository implements AppRepository {
  private tasks = new Map<string, StoredTask>();
  private results = new Map<string, StoredResult>();
  private users = new Map<string, StoredUser>();

  private readonly filePath: string | null;

  constructor(options: MemoryRepositoryOptions = {}) {
    this.filePath = options.filePath ?? null;
    if (this.filePath) this.load(this.filePath);
  }

  // --- Задания -------------------------------------------------------------

  async createTask(task: Omit<StoredTask, 'id' | 'answered'>): Promise<StoredTask> {
    const stored: StoredTask = { ...task, id: randomUUID(), answered: false };
    this.tasks.set(stored.id, stored);
    this.persist();
    return stored;
  }

  async findTask(id: string): Promise<StoredTask | null> {
    return this.tasks.get(id) ?? null;
  }

  async saveResult(input: SaveResultInput): Promise<void> {
    const task = this.tasks.get(input.taskId);
    if (task) task.answered = true;

    this.results.set(input.taskId, {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });
    this.persist();
  }

  async bestScore(
    userId: string,
    gameType: GameType,
    difficulty: Difficulty,
    exceptTaskId: string,
  ): Promise<number | null> {
    let best: number | null = null;

    for (const [taskId, result] of this.results) {
      if (taskId === exceptTaskId) continue;

      const task = this.tasks.get(taskId);
      if (!task) continue;
      if (task.userId !== userId) continue;
      if (task.gameType !== gameType || task.difficulty !== difficulty) continue;

      if (best === null || result.score > best) best = result.score;
    }

    return best;
  }

  // --- Пользователи --------------------------------------------------------

  async createUser(login: string, passwordHash: string): Promise<UserRecord> {
    const stored: StoredUser = {
      id: randomUUID(),
      login,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.users.set(stored.id, stored);
    this.persist();
    return toUser(stored);
  }

  async findUserByLogin(login: string): Promise<UserRecord | null> {
    const needle = login.toLowerCase();
    for (const user of this.users.values()) {
      if (user.login.toLowerCase() === needle) return toUser(user);
    }
    return null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const user = this.users.get(id);
    return user ? toUser(user) : null;
  }

  // --- Статистика ----------------------------------------------------------

  async attempts(userId: string, limit?: number): Promise<AttemptRow[]> {
    const rows: AttemptRow[] = [];

    for (const [taskId, result] of this.results) {
      const task = this.tasks.get(taskId);
      if (!task || task.userId !== userId) continue;

      rows.push({
        id: result.id,
        gameType: task.gameType,
        difficulty: task.difficulty,
        accuracy: result.accuracy,
        score: result.score,
        responseTimeMs: result.responseTimeMs,
        playedAt: new Date(result.createdAt),
      });
    }

    rows.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
    return limit === undefined ? rows : rows.slice(0, limit);
  }

  // --- Файл ----------------------------------------------------------------

  private load(file: string): void {
    if (!fs.existsSync(file)) return;

    try {
      const snapshot = JSON.parse(fs.readFileSync(file, 'utf8')) as Snapshot;
      if (snapshot.version !== 1) return;

      for (const task of snapshot.tasks ?? []) this.tasks.set(task.id, task);
      for (const result of snapshot.results ?? []) this.results.set(result.taskId, result);
      for (const user of snapshot.users ?? []) this.users.set(user.id, user);
    } catch (error) {
      // Повреждённый файл не должен мешать запуску: начинаем с пустого
      // состояния и говорим об этом вслух, чтобы это не выглядело как
      // «данные пропали сами».
      console.warn(`Не удалось прочитать ${file}, начинаем с пустого хранилища:`, error);
    }
  }

  private persist(): void {
    if (!this.filePath) return;

    const snapshot: Snapshot = {
      version: 1,
      tasks: [...this.tasks.values()],
      results: [...this.results.values()],
      users: [...this.users.values()],
    };

    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });

      // Пишем во временный файл и переименовываем: если процесс упадёт
      // в середине записи, на диске останется прошлая целая версия,
      // а не обрезанный наполовину JSON.
      const temp = `${this.filePath}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(snapshot, null, 2), 'utf8');
      fs.renameSync(temp, this.filePath);
    } catch (error) {
      console.warn(`Не удалось сохранить ${this.filePath}:`, error);
    }
  }
}

function toUser(stored: StoredUser): UserRecord {
  return {
    id: stored.id,
    login: stored.login,
    passwordHash: stored.passwordHash,
    createdAt: new Date(stored.createdAt),
  };
}
