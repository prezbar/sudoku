# Testing

- The suite runs on Vitest 5; the database plumbing is the repo's own SQLite harness in `tests/` (`global-setup.ts` migrates a template database file once per run and copies it per worker, `setup.ts` points `DATABASE_URL` at the worker's copy, `database.ts` holds `setupDatabase`), the factories are `@flefebvre/prisma-factorio`. Before writing or evolving a factory, read `node_modules/@flefebvre/prisma-factorio/docs/for-agents.md`.
- Tests are collocated with the file they test, as `.test.ts` files (`foo.test.ts` next to `foo.ts`).
- Lay out each test body as Arrange / Act / Assert, one blank line between phases; two phases that fuse into one statement share a block, and a phase a test doesn't have is simply absent.
- The harness lives in `tests/` (`global-setup.ts`, `setup.ts`); test files never wire it themselves.
- A test file that touches the database calls `setupDatabase(db)` (from `@/tests/database`, with `db` from `@/infra/prisma/db`) once at the top. Writes commit for real, and the harness restores every table to the migrated template after each test, keeping the rows migrations insert and restarting ids; a factory call in a file that skipped it throws.
- Keep `pool: "forks"` and `isolate: true` in `vitest.config.mts`: each worker owns one database file, and `setupDatabase` keeps its opt-in state per module instance, so per file.
- Build the rows a test needs in the test or its `beforeEach`, never in `beforeAll`: the reset after the file's first test deletes them.
- Data setup goes through the factories in `tests/factories/` (one per model, over the `factorio.ts` bootstrap) rather than through the Prisma client directly; if the factory you need is missing or too narrow, create or evolve it.
- Definitions receive a `faker` reseeded from the test's name before each test, so rerunning one test with `-t` replays its data; `uid` stays random per process, so never assert on a `uid`-derived value.
