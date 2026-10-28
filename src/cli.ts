#!/usr/bin/env node
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { TaskStore } from './store.js';

const help = `Ether CLI — task manager

Usage:
  ether add <title>          Add a task (quotes optional)
  ether list [--pending|--done]
  ether done <id>            Mark a task complete
  ether remove <id>          Delete a task
  ether help

Storage: ~/.ether-cli/tasks.json
Override with ETHER_TASKS_FILE.`;

async function main(): Promise<void> {
  const [command = 'help', ...args] = process.argv.slice(2);
  const store = new TaskStore(process.env.ETHER_TASKS_FILE ? resolve(process.env.ETHER_TASKS_FILE) : join(homedir(), '.ether-cli', 'tasks.json'));
  switch (command) {
    case 'help': case '--help': case '-h':
      if (args.length) throw new Error('Help takes no arguments.');
      console.log(help);
      break;
    case 'add': {
      const task = await store.add(args.join(' '));
      console.log(`Added #${task.id}: ${task.title}`);
      break;
    }
    case 'list': {
      if (args.length > 1 || (args.length === 1 && !['--pending', '--done'].includes(args[0]))) throw new Error('Usage: ether list [--pending|--done]');
      const tasks = (await store.list()).filter(t => !args.length || t.done === (args[0] === '--done'));
      console.log(tasks.length ? tasks.map(t => `${t.done ? '[x]' : '[ ]'} #${t.id} ${t.title}`).join('\n') : 'No tasks found.');
      break;
    }
    case 'done': case 'remove': {
      if (args.length !== 1 || !/^[1-9]\d*$/.test(args[0]) || !Number.isSafeInteger(Number(args[0]))) throw new Error(`Usage: ether ${command} <positive integer id>`);
      const task = await store.update(Number(args[0]), command === 'remove');
      console.log(`${command === 'remove' ? 'Removed' : 'Completed'} #${task.id}: ${task.title}`);
      break;
    }
    default: throw new Error(`Unknown command: ${command}. Run ether help for usage.`);
  }
}

main().catch((error: unknown) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
