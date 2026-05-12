# Task Board — Interview Practice

A small full-stack TypeScript app for practicing a senior-developer-style
interview: triage bug reports, trace symptoms to root cause, fix them, and
build a small feature.

The app is a Kanban-style task board: a single board with multiple columns
("Backlog", "In Progress", "In Review", "Done"), each holding tasks with
title, description, priority, assignee, and an optional due date.

```
┌────────── Web (Vite + React + Apollo Client) ──────────┐
│                http://localhost:5173                   │
│                          │                             │
│                          ▼  GraphQL over HTTP          │
│              ┌────────────────────────┐                │
│              │  API (Apollo Server +  │                │
│              │  Prisma + TypeScript)  │                │
│              │  http://localhost:4000 │                │
│              └────────────┬───────────┘                │
│                           │ Prisma                     │
│                           ▼                            │
│                  ┌────────────────┐                    │
│                  │ Postgres 16    │ (in Docker)        │
│                  │ port 5432      │                    │
│                  └────────────────┘                    │
└────────────────────────────────────────────────────────┘
```

## Prerequisites

- **macOS, Linux, or WSL 2.** Native Windows shells are not supported.
- **Git**
- **Docker** — [Docker Desktop](https://www.docker.com/products/docker-desktop/) or equivalent
- **Node.js 24.11.0** — use a version manager
  ([fnm](https://github.com/Schniz/fnm),
  [nvm](https://github.com/nvm-sh/nvm), or
  [mise](https://mise.jdx.dev/)). An `.nvmrc` and `.tool-versions`
  pin the version.
- **Yarn** via [Corepack](https://nodejs.org/api/corepack.html) (`corepack
  enable`). The `packageManager` field pins **yarn 4.5.3**.

## Quick start

```bash
# 1. clone & install
git clone <this-repo> task-board && cd task-board
corepack enable
yarn install

# 2. start Postgres
cp .env.example .env
yarn db:up                # docker compose up -d postgres

# 3. push the Prisma schema and seed the database
yarn db:push              # creates tables
yarn db:seed              # populates board, columns, tasks, users

# 4. start the API and the web app in parallel
yarn dev
```

When it's running:

- Web app: <http://localhost:5173>
- GraphQL: <http://localhost:4000/graphql> (Apollo Sandbox available
  via Apollo Explorer at the same URL)
- Postgres: `postgresql://taskboard:taskboard@localhost:5432/taskboard`

Useful one-offs:

```bash
yarn db:reset        # wipe db volume, re-push, re-seed
yarn db:studio       # `prisma studio` to poke at the data
yarn typecheck       # type-check both packages
yarn build           # production build of both packages
```

## Project layout

```
task-board-interview-practice/
├── docker-compose.yml         # Postgres only — app runs on the host
├── .env.example
├── package.json               # Yarn workspaces root
├── packages/
│   ├── api/                   # GraphQL server (Apollo Server 4 + Prisma)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── index.ts       # HTTP/Apollo bootstrap
│   │       ├── schema.ts      # GraphQL SDL
│   │       ├── resolvers/     # Query, Mutation, type resolvers
│   │       ├── context.ts
│   │       └── prisma.ts
│   └── web/                   # React + Apollo Client (Vite)
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── apollo.ts
│           ├── graphql/operations.ts
│           ├── components/    # Board, Column, TaskCard, NewTaskForm
│           ├── types.ts
│           └── styles.css
├── BUGS.md                    # ★ start here in the interview
└── README.md
```

## What to do during the interview

1. Read **[`BUGS.md`](./BUGS.md)** — it's written like a small batch of
   bug reports from a PM/QA. Some include short reproduction steps; root
   causes are intentionally not given.
2. Triage and prioritize. Talk through what you'd fix first and why.
3. Fix at least the highest-priority bugs. Open the GraphQL sandbox,
   inspect Apollo's cache, tail the API logs (`LOG_PRISMA=1 yarn dev:api`
   surfaces every SQL query — handy for the N+1 bug) — whatever helps.
4. After (or alongside) the bug fixes, build the **feature request** in
   `BUGS.md`.
5. Push your fixes to a branch / open a PR.

## Tips

- **Run Prisma in query-logging mode** to spot N+1 patterns:

  ```bash
  LOG_PRISMA=1 yarn dev:api
  ```

- **Apollo DevTools** in your browser shows the normalized cache and
  every mutation. Inspecting `Column:<id>` after creating a task makes
  one of the bugs much easier to see.

- **Reset cleanly** when state gets weird:

  ```bash
  yarn db:reset
  ```

- The seed intentionally puts more than 9 tasks in the "Backlog" column
  so one of the sort-order bugs is observable immediately.

## License

MIT — do whatever you want with it. This is a practice scaffold.
