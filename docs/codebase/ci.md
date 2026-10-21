# CI

`.github/workflows/ci.yml` runs on every pull request, whatever its base branch, and every push to `main`. A superseded run on the same ref is cancelled, except on `main`, where every push keeps its run. Its jobs run in parallel: `static`, `test`, `build`, then `ci`, which waits for the other three.

- Give each stage of the `gate` line in package.json its own job, and each script in it its own step, in the gate's order, so a failing check names itself in the run summary.
- Keep the summary job named `ci`: it is the status check the `main` ruleset requires, so a renamed job blocks every merge. Add every new job to its `needs`, and keep its `if: ${{ !cancelled() }}` and its check that every needed job succeeded — a required check that is skipped counts as passing, so without them a failed job would leave a mergeable PR.
- Split the test suite by adding a number to the `test` job's `shard` list when that job becomes the longest one; the shard count is read from the list.
- Restore caches only for tools that reuse them across runs — `node_modules/.cache` (Prettier, ESLint) and `tsconfig.tsbuildinfo` in `static`, `.next/cache` in `build` — keyed on the lockfile and the commit, restored from the latest key with the same lockfile, and placed after the install.
- Put a step every job needs in `.github/actions/setup`, the composite action each job calls right after checkout, never copied into the jobs.
- Take the environment from `.env.example`, copied to `.env` ahead of the checks — never a second list of placeholders in the workflow. A required variable missing from that file then fails CI instead of passing unnoticed, and it fails at Typecheck already: `next typegen` loads `next.config.ts`, and so validates the client environment, just as `next build` does.
- Pin `node-version` to the major the repo is developed on. `engines` only sets a floor (`>=22`), so a spec taken from it would let CI drift onto a major nobody has run.
- Keep `pnpm/action-setup` ahead of `actions/setup-node`, which needs pnpm on the PATH for `cache: pnpm`. It takes no `version` input: pnpm resolves from the `packageManager` pin in package.json.

Before pushing a change to the workflow, lint it with `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest`, and reproduce CI's environment by running `pnpm gate` with `.env` copied from `.env.example`.
