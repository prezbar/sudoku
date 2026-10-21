# App Router

## When to use which

In order of preference — reach for the next one only when the previous doesn't fit:

1. **Server components** for display. Pages and layouts fetch their own data during render; never add an API route just to feed a page its own initial data.
2. **Server actions** for the page's main action — the mutation the user is there to perform (the form submit, the primary button). Actions are queued one at a time per client, which is fine for the main action and wrong for anything else.
3. **API routes** (route handlers) for what runs alongside the main flow — typeahead, polling, autosave, client-side reads after the initial render — and for callers that are not this app's pages at all (webhooks, external clients).

## Structure

- A page's server actions live in `actions.ts` next to its `page.tsx`.
- Components specific to one page live in a `_components/` folder next to it (the underscore keeps the folder out of routing).
- A component used by more than one page moves to `src/components/<feature-group>/` (e.g. `src/components/billing/`) — start local in `_components/`, promote when the second use appears: move the file and update the imports, leaving no re-export behind.
- Every server entry point — pages, layouts, server actions, route handlers — is written with next-pipe. Keep logic inline in the pipe; extract a middleware only when a second surface needs the same step.
- A server action's `error(key, …)` and its Zod schema messages carry a technical key, never prose; the client component that called the action maps the key to a message (see `docs/codebase/i18n.md`).
- Client-side calls to API routes go through the generated client in `generated/routes/` (imported as `@/generated/routes`) — never a hand-written `fetch`.
- Components are server components by default; add `"use client"` only at the leaves that need interactivity, not on whole pages.
