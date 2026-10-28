# Ether CLI

A terminal task manager built with TypeScript and Node.js. Part of the Ether engineering journey: practice argument parsing, filesystem I/O, JSON persistence, validation, and error handling.

## Run

Requires Node.js 22 or later and npm.

```sh
npm install
npm run build
node dist/cli.js add "Learn filesystem I/O"
node dist/cli.js list
node dist/cli.js done 1
node dist/cli.js list --done
node dist/cli.js remove 1
```

For development, use `npm run dev -- add "Write tests"`. To install the local command, run `npm link`, then `ether help`.

Tasks are saved to `.ether-cli/tasks.json` in your home directory, independently of the current working directory. Set `ETHER_TASKS_FILE` to use another path. In PowerShell:

```powershell
$env:ETHER_TASKS_FILE = "$PWD/tasks.json"
npm run dev -- list --pending
```

Commands: `add <title>`, `list [--pending|--done]`, `done <id>`, `remove <id>`, and `help`. Errors print to stderr and exit with code 1. IDs remain stable after deletion. Marking a completed task done again is safe.

## Verify

```sh
npm run check
npm test
npm run build
```

Tests exercise the CLI in separate processes using isolated temporary storage, including persistence, filters, invalid arguments, missing IDs, and corrupted files.

## Design and limitations

`src/cli.ts` handles arguments and terminal output; `src/store.ts` validates and persists tasks. No CLI framework or runtime dependencies are needed. Writes use a temporary file followed by rename, and invalid existing data is rejected before writing. The JSON format stores `nextId` and a `tasks` array.

This is a single-user learning tool. Run one modifying command at a time: concurrent writers are not locked and can overwrite each other's changes. It loads the full file into memory and has no editing, due dates, or synchronization.
