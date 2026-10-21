## Context

`sudoku` is a Sudoku web app: a player gets a random grid, plays it until it is complete, then enters their name, and the result is saved in a SQLite database.

## Stack

- Next.js 16.4 (App Router, Cache Components), React 19.3 with the React Compiler
- TypeScript 6, `strict`
- Tailwind CSS v4, Shadcn/ui (`base-nova` style, Base UI + lucide)
- Next-pipe (`@flefebvre/next-pipe`) for every server entry point, zod 4 for validation
- next-intl 4 for every user-readable string; see `docs/codebase/i18n.md`
- Prisma 7 on SQLite, through the `@prisma/adapter-better-sqlite3` driver adapter
- ESLint 9, Prettier 3 (sorts Tailwind classes), jscpd 4 (copy/paste detection)
- tsx, for the repo scripts

## Layout

```
src/
  app/          App Router; see docs/codebase/app-router.md for its conventions
  components/   React components;
    games/      Components more than one page uses
    ui/         Shadcn-vendored, edit only through the CLI
  lib/          Shared code
    games/      Game rules shared by the pages: player name schema, durations, best times
    i18n/       Locale routing, request config, and the message files
    sudoku/     Grid, seeded randomness, solver, generator and validation, ported from docs/sudoku.md
  infra/        Everything the app talks to the outside world through
    prisma/     Schema, client, and migrations
data/           The local SQLite database files, gitignored
generated/      Codegen output, imported as `@/generated/*`, never hand-edit
  prisma/       Prisma client
  routes/       Next-pipe API client
scripts/        Repo tooling, run with tsx
tests/          Vitest suite and its harness wiring
  factories/    One model factory per file, over the `factorio.ts` bootstrap
public/         Static assets served at the root
docs/
  agents/       Agent-skill config: issue tracker, triage labels, domain docs
  codebase/     Conventions, one file per area, linked from the AGENTS.md section it governs
```

## Commands

To get started: copy `.env.example` to `.env` and run `pnpm prisma migrate deploy`, which creates the SQLite database at the `DATABASE_URL` path. The tests need no database of their own: each run migrates a throwaway SQLite file and copies it per worker.

```
pnpm dev                  Run the app (next dev) on :3000
pnpm check                Format check, lint, duplication, typecheck, then the tests affected since $CHECK_BASE (default origin/main) — the inner loop
pnpm gate                 Format check, lint, duplication, typecheck, then test and build — the full check, the same as CI
pnpm build                Production build
pnpm start                Serve the production build (build first); `prestart` validates the environment and aborts on failure
pnpm next-pipe:gen        Next-pipe codegen — re-run after adding/moving a route, verb, or path param
pnpm prisma generate      Prisma Client codegen — re-run after every schema change
pnpm prisma migrate dev   Create and apply a migration from the schema (development)
pnpm prisma migrate deploy  Apply the pending migrations to the DATABASE_URL database
pnpm format               Prettier, rewriting files in place
pnpm format:check         Prettier in check mode (fails on unformatted files)
pnpm lint                 ESLint 9 flat config (eslint.config.mjs), warnings are failures
pnpm duplication          jscpd copy/paste detection (.jscpd.json); any clone is a failure
pnpm typecheck            Next route typegen, then TypeScript with no emit
pnpm test                 Vitest, once
pnpm test:changed         Vitest, once, only the tests affected since $CHECK_BASE (default origin/main)
```

## Verification

- check: `CHECK_BASE=origin/<base-branch> pnpm check`
- gate: `pnpm gate`
- final: ci

`<base-branch>` is the branch the change will merge into, `main` unless told otherwise. Run `check` after each step and each fix; it passed only if the output ends with `--check OK--`. A change is done when the pushed PR's `ci` check is green; a change that will not be pushed passes `pnpm gate` (ends with `--gate OK--`) once before it is handed over; later fixes re-run `check`, and CI re-validates the change when it is pushed. Any other ending is a failure, whatever the rest of the output says.

The `check` and `gate` lines in package.json are the sequences: `,` separates stages run in order, `+` joins scripts run in parallel. Never join two scripts that write the same files — `typecheck` and `build` both write `.next/types`. Add a check to the `gate` line and to the CI workflow, which runs one job per stage. See `docs/codebase/ci.md`.

## Worktrees

- Create and leave worktrees with the `EnterWorktree` and `ExitWorktree` tools, never with `git worktree add`.
- Run `git fetch` before creating one: a worktree starts from `origin/main`, not local `main`.
- In a new worktree, run `cp .env.example .env` and `pnpm install` before anything else.

## Testing

This project uses TDD. Tests are collocated with the file they test. See `docs/codebase/testing.md` before writing tests.

## Naming

Every name passes the test in `docs/codebase/naming.md`; read it before naming or renaming anything.

## Documentation

Always reach for documentation rather than working from memory. Prioritize the files below first, and then ctx7. Repo conventions live in `docs/codebase/`, linked from the section they govern; the sources below are external reference.

- `node_modules/next/dist/docs/01-app/` — when writing anything under `src/app/`. This Next.js has breaking changes your training data predates — read the relevant page first rather than recalling an older API. `03-api-reference/` is the per-feature reference.
- `node_modules/@flefebvre/next-pipe/docs/for-agents.md` — before touching a server entry point, a middleware, or a client call to an API route. It ships with the installed version and links the per-pipe pages.

## Comments and docs

Don't write comments in the code — `pnpm lint` fails on any that isn't a directive. Do not touch `docs/` unless explicitly asked by the user.

## Language

Prose in this repo — docs, commit messages, issues — is written in English, regardless of the language used in conversation.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues on this repo's GitHub remote, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label named after its role. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and one `docs/adr/` at the repo root, both created on first use. See `docs/agents/domain.md`.

## Keeping this file current

If your changes mandate an update to a section of this `AGENTS.md` file, make the change. Do not add any sections on your own. How this file and `docs/codebase/` are written: `docs/codebase/agent-docs.md`.
