# Bug reports & feature request

> Written PM/QA-style. Root causes are deliberately **not** spelled out —
> finding them is the exercise. Each report includes how to reproduce.
> Severities are suggestions; feel free to disagree and explain why.

## Bug #1 · "Task count badge on each column lies after I add a task"

**Reporter:** PM · **Severity:** medium · **Area:** web

> When I add a task to a column, the new card appears in the column right
> away (good), but the little count badge in the column header keeps
> showing the **old** number. If I refresh the page it updates.
> Deleting a task has the opposite problem — the card disappears but the
> badge doesn't change until refresh.

**Repro**

1. `yarn db:reset && yarn dev`
2. Note the count in any column header (e.g. "In Progress: 3").
3. Click "+ Add task", give it a title, submit.
4. Card appears in the column. Badge still says "3".
5. Reload the page → badge now correctly says "4".

**Notes / hints (use sparingly)**

- Look at the `BOARD_QUERY` and what it asks for vs. what
  `createTask` / `deleteTask` return.
- Apollo's normalized cache is your friend.

---

## Bug #2 · "Board page is really slow once we have a lot of tasks"

**Reporter:** engineer · **Severity:** medium · **Area:** api / perf

> I ran `yarn db:seed` and hit `/graphql` with the board query. Postgres
> shows **one `SELECT` per task** to fetch the assignee — so the seeded
> board (~24 tasks) issues ~25 user lookups for a single page load.
> This is going to bite us as soon as a column has a few hundred tasks.

**Repro**

1. Restart the API with query logging:
   ```bash
   LOG_PRISMA=1 yarn dev:api
   ```
2. Load the board in the browser, or run the `Board` query in the GraphQL
   sandbox.
3. Watch the API logs.

**Acceptance**

- Loading the board should not scale linearly with task count for
  assignee resolution. Either batch the lookups (DataLoader is a fine
  choice), use `prisma.task.findMany({ include: { assignee: true } })`,
  or otherwise eliminate the per-row query.

---

## Bug #3 · "Tasks are listed in the wrong order in the Backlog column"

**Reporter:** QA · **Severity:** high · **Area:** db / api

> The Backlog column has 12 tasks in it. They're displayed in this order
> in the UI:
>
> ```
> Backlog item 1
> Backlog item 10
> Backlog item 11
> Backlog item 12
> Backlog item 2
> Backlog item 3
> ...
> ```
>
> That's clearly not what was seeded. Smaller columns (≤ 9 tasks) look
> fine, which makes the bug feel intermittent until you notice the
> pattern.

**Repro**

1. `yarn db:reset` (the seed deliberately puts 12 tasks in Backlog).
2. Open the board.
3. Compare the rendered order to the seed data in
   `packages/api/prisma/seed.ts`.

**Notes / hints**

- The lexicographic-vs-numeric clue is real.
- The fix probably touches both the Prisma schema and (after a
  migration) the data already in the DB.

---

## Bug #4 · "Due dates are off by one day"

**Reporter:** support · **Severity:** medium · **Area:** web

> A customer reported they set a task due **April 15** but the card
> shows **Due Apr 14**. I can reproduce it on my machine (US Pacific).
> One of our European teammates says it looks correct for him, which is
> the giveaway.

**Repro**

1. Set your machine's timezone to something west of UTC
   (e.g. `America/Los_Angeles`).
2. `yarn db:reset && yarn dev`.
3. Create a new task; pick tomorrow's date in the due-date picker.
4. Save. The card shows yesterday's date (relative to the picker).

**Notes / hints**

- Both ends of the pipeline are slightly wrong; you may need to touch
  the form, the API, the display, or some combination. The right answer
  depends on whether you treat "due date" as a calendar date or an
  instant.

---

## Bug #5 · "Drag-and-drop reordering eventually breaks the column"

**Reporter:** engineer · **Severity:** high · **Area:** api / data integrity

> *(Note: the UI doesn't yet expose drag-and-drop, but the underlying
> `moveTask` mutation is already wired up and used by tests / direct
> GraphQL calls.)*
>
> If I call `moveTask` to drop a task into the middle of a column, the
> mutation succeeds, but the next time I load the board the column shows
> tasks in a stable-but-arbitrary order. After enough `moveTask` calls,
> the column has multiple tasks with the **same `position`** in the
> database.

**Repro**

```graphql
mutation Move {
  moveTask(input: { taskId: "<id>", toColumnId: "<columnId>", toIndex: 2 }) {
    id
    position
  }
}
```

Run that a couple of times against different tasks in the same column,
then `SELECT id, title, position FROM "Task" WHERE "columnId" = '<columnId>' ORDER BY position;`
and you'll see duplicates.

**Acceptance**

- After any `moveTask`, the affected column(s) should have a clean,
  collision-free ordering. Pick a strategy you can justify (renumber all
  siblings; use fractional indexing; sparse integer gaps; etc.) — be
  prepared to explain the tradeoff.

---

## Feature request · Filter tasks by title

**Severity:** small feature · **Estimated:** 30–45 min

We'd like a search input at the top of the board that filters tasks by
title across **all** columns. Empty input shows everything. Search should
be case-insensitive, match anywhere in the title, and feel snappy
(debounce or throttle as you see fit).

**Requirements**

- Single text input rendered above the board (`App.tsx` is a fine place
  for it).
- Backend: add a `search` argument to the `board` query (or wherever you
  think it belongs) and apply it as a `WHERE title ILIKE '%…%'`
  predicate.
- Columns continue to render even if they end up empty (so the layout
  doesn't shift).
- No regressions to the bugs you've already fixed.

**Stretch (only if there's time):** persist the search query in the URL
(`?q=…`) so reloading preserves the filter.

---

## What we're looking for

- **Triage.** Talk through how you'd order these reports if you only had
  half a day.
- **Tracing.** Show us how you go from symptom to root cause. Reading
  the code, the schema, the network tab, the Prisma logs — whatever
  you'd actually do.
- **Fix quality.** Minimal, well-scoped diffs that don't introduce new
  bugs. Comments only where they earn their keep.
- **Communication.** You won't be docked for asking "stupid" questions
  or for poking around the codebase. We'd rather see how you think than
  watch you guess silently.
