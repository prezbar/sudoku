`sudoku` is a Sudoku web app: a player gets a random grid, plays it until it is complete, then enters their name, and the result is saved in a SQLite database.

Built on Next.js 16, Prisma 7 on SQLite (`better-sqlite3`), Tailwind CSS v4 and Vitest. To get started:

```
cp .env.example .env
pnpm install
pnpm prisma migrate deploy
pnpm dev
```

`AGENTS.md` lists the commands and conventions; `pnpm gate` runs the full check, the same as CI.
