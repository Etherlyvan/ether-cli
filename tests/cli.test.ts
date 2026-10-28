import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { TaskStore } from '../src/store.js';

test('CLI persists tasks, filters completion, deletes, and does not reuse IDs', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ether-test-'));
  const file = join(directory, 'nested', 'tasks.json');
  const run = (...args: string[]) => spawnSync(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), ...args], {
    env: { ...process.env, ETHER_TASKS_FILE: file }, encoding: 'utf8'
  });
  try {
    assert.match(run('list').stdout, /No tasks/);
    assert.match(run('add', 'Learn', 'file IO').stdout, /Added #1: Learn file IO/);
    assert.equal(run('done', '1').status, 0);
    assert.match(run('list', '--done').stdout, /\[x\] #1/);
    assert.match(run('list', '--pending').stdout, /No tasks/);
    assert.equal(run('remove', '1').status, 0);
    assert.match(run('add', 'Next').stdout, /Added #2/);
    for (const args of [['done', '1'], ['done', '2abc'], ['remove', '0'], ['add'], ['list', '--oops'], ['unknown']]) {
      const result = run(...args);
      assert.equal(result.status, 1, args.join(' '));
      assert.match(result.stderr, /Error:/);
    }
    assert.equal((await new TaskStore(file).list()).length, 1);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('corrupt storage is reported and never overwritten', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ether-test-'));
  const file = join(directory, 'tasks.json');
  try {
    for (const raw of ['{broken', 'null', '{"nextId":1,"tasks":[{"id":1,"title":"x","done":false}]}']) {
      await writeFile(file, raw);
      await assert.rejects(new TaskStore(file).add('New'), /invalid/);
      assert.equal(await readFile(file, 'utf8'), raw);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
