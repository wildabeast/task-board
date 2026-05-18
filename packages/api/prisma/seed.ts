import { PrismaClient, Priority } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = [
  { name: "Alex Morgan", email: "alex@taskboard.dev" },
  { name: "Sam Patel", email: "sam@taskboard.dev" },
  { name: "Jordan Kim", email: "jordan@taskboard.dev" },
  { name: "Riley Chen", email: "riley@taskboard.dev" },
];

const COLUMNS = [
  { name: "Backlog", position: 0 },
  { name: "In Progress", position: 1 },
  { name: "In Review", position: 2 },
  { name: "Done", position: 3 },
];

// 12 tasks so the lexicographic-sort bug is visible (positions "1".."12").
const TASK_TITLES = [
  "Set up CI pipeline",
  "Write onboarding docs",
  "Fix flaky login test",
  "Add dark mode toggle",
  "Refactor auth middleware",
  "Migrate to Postgres 16",
  "Investigate memory leak in worker",
  "Design new dashboard layout",
  "Wire up Stripe webhooks",
  "Improve search relevance",
  "Add CSV export to reports",
  "Decommission legacy admin panel",
];

async function main() {
  // Clean slate — safe because the seed is the only writer in dev.
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all(
    USERS.map((u) =>
      prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          avatarUrl: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(u.name)}`,
        },
      }),
    ),
  );

  const board = await prisma.board.create({
    data: {
      name: "Engineering Roadmap",
      columns: {
        create: COLUMNS.map((c) => ({ name: c.name, position: c.position })),
      },
    },
    include: { columns: true },
  });

  const orderedColumns = [...board.columns].sort((a, b) => a.position - b.position);
  const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  for (let i = 0; i < TASK_TITLES.length; i++) {
    const title = TASK_TITLES[i]!;
    const column = orderedColumns[i % orderedColumns.length]!;
    const assignee = users[i % users.length]!;
    // Tasks 0-2 are due tomorrow, 3-5 next week, rest unset.
    let dueDate: Date | null = null;
    if (i < 3) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setUTCHours(0, 0, 0, 0);
      dueDate = d;
    } else if (i < 6) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      d.setUTCHours(0, 0, 0, 0);
      dueDate = d;
    }

    await prisma.task.create({
      data: {
        title,
        description: `Auto-seeded task #${i + 1}.`,
        position: i + 1,
        priority: priorities[i % priorities.length]!,
        dueDate,
        columnId: column.id,
        assigneeId: assignee.id,
      },
    });
  }

  // Pile a bunch of tasks into the Backlog column to make the
  // lexicographic-sort and N+1 bugs really obvious.
  const backlog = orderedColumns[0]!;
  for (let i = 0; i < 12; i++) {
    await prisma.task.create({
      data: {
        title: `Backlog item ${i + 1}`,
        description: "Filler task to make sort order and N+1 issues visible.",
        position: i + 1,
        priority: priorities[i % priorities.length]!,
        columnId: backlog.id,
        assigneeId: users[i % users.length]!.id,
      },
    });
  }

  console.log(`Seeded ${users.length} users, 1 board, ${COLUMNS.length} columns, ${TASK_TITLES.length + 12} tasks.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
