import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface Task {
  id: number;
  title: string;
  done: boolean;
}

interface Database {
  nextId: number;
  tasks: Task[];
}

export class TaskStore {
  constructor(private readonly file: string) {}

  private async read(): Promise<Database> {
    let raw: string;
    try {
      raw = await readFile(this.file, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { nextId: 1, tasks: [] };
      throw error;
    }
    let db: Database;
    try { db = JSON.parse(raw); } catch { throw new Error('Task file contains invalid JSON. Restore it before continuing.'); }
    if (!db || !Number.isSafeInteger(db.nextId) || db.nextId < 1 || !Array.isArray(db.tasks) ||
      db.tasks.some(t => !t || !Number.isSafeInteger(t.id) || t.id < 1 || typeof t.title !== 'string' || !t.title.trim() || typeof t.done !== 'boolean') ||
      new Set(db.tasks.map(t => t.id)).size !== db.tasks.length || db.tasks.some(t => t.id >= db.nextId)) {
      throw new Error('Task file has an invalid structure. Restore it before continuing.');
    }
    return db;
  }

  private async write(db: Database): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    const temporary = `${this.file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(db, null, 2) + '\n', { flag: 'wx' });
      await rename(temporary, this.file);
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }

  async list(): Promise<Task[]> { return (await this.read()).tasks; }

  async add(title: string): Promise<Task> {
    title = title.trim();
    if (!title) throw new Error('Task title must not be empty.');
    const db = await this.read();
    if (db.nextId >= Number.MAX_SAFE_INTEGER) throw new Error('Task ID limit reached.');
    const task = { id: db.nextId++, title, done: false };
    db.tasks.push(task);
    await this.write(db);
    return task;
  }

  async update(id: number, remove = false): Promise<Task> {
    const db = await this.read();
    const task = db.tasks.find(t => t.id === id);
    if (!task) throw new Error(`Task #${id} not found.`);
    if (remove) db.tasks = db.tasks.filter(t => t.id !== id);
    else task.done = true;
    await this.write(db);
    return task;
  }
}
