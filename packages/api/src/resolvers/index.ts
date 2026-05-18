import { GraphQLDateTime } from "graphql-scalars";
import type { Context } from "../context.js";
import type { Priority } from "@prisma/client";

interface CreateTaskInput {
  columnId: string;
  title: string;
  description?: string | null;
  priority?: Priority | null;
  dueDate?: Date | null;
  assigneeId?: string | null;
}

interface UpdateTaskInput {
  title?: string | null;
  description?: string | null;
  priority?: Priority | null;
  dueDate?: Date | null;
  assigneeId?: string | null;
}

interface MoveTaskInput {
  taskId: string;
  toColumnId: string;
  toIndex: number;
}

export const resolvers = {
  DateTime: GraphQLDateTime,

  Query: {
    board: async (_: unknown, args: { id?: string | null }, ctx: Context) => {
      if (args.id) {
        return ctx.prisma.board.findUnique({ where: { id: args.id } });
      }
      // Default: return the first board so the UI has something to render.
      return ctx.prisma.board.findFirst({ orderBy: { createdAt: "asc" } });
    },
    users: (_: unknown, __: unknown, ctx: Context) =>
      ctx.prisma.user.findMany({ orderBy: { name: "asc" } }),
  },

  Board: {
    columns: (parent: { id: string }, _: unknown, ctx: Context) =>
      ctx.prisma.column.findMany({
        where: { boardId: parent.id },
        orderBy: { position: "asc" },
      }),
  },

  Column: {
    tasks: (parent: { id: string }, _: unknown, ctx: Context) =>
      ctx.prisma.task.findMany({
        where: { columnId: parent.id },
        // BUG: tasks are ordered by `position`, but `position` is a String
        // column in the schema. Postgres therefore sorts lexicographically,
        // so "10" comes before "2". See BUGS.md #3.
        orderBy: { position: "asc" },
      }),
    taskCount: (parent: { id: string }, _: unknown, ctx: Context) =>
      ctx.prisma.task.count({ where: { columnId: parent.id } }),
  },

  Task: {
    // BUG #2: this fires one query per task (N+1). Every Task in every
    // Column triggers its own SELECT against the users table. Using
    // `findFirst` here (rather than `findUnique`) means Prisma cannot
    // auto-batch the calls, so the inefficiency is fully exposed. See
    // BUGS.md.
    assignee: async (parent: { assigneeId: string | null }, _: unknown, ctx: Context) => {
      if (!parent.assigneeId) return null;
      return ctx.prisma.user.findUnique({ where: { id: parent.assigneeId } });
    },
    column: (parent: { columnId: string }, _: unknown, ctx: Context) =>
      ctx.prisma.column.findUnique({ where: { id: parent.columnId } }),
  },

  Mutation: {
    createTask: async (
      _: unknown,
      args: { input: CreateTaskInput },
      ctx: Context,
    ) => {
      const { input } = args;
      const trimmed = input.title.trim();
      if (!trimmed) {
        throw new Error("Task title is required");
      }
      const count = await ctx.prisma.task.count({ where: { columnId: input.columnId } });
      return ctx.prisma.task.create({
        data: {
          title: trimmed,
          description: input.description ?? null,
          priority: input.priority ?? "MEDIUM",
          dueDate: input.dueDate ?? null,
          assigneeId: input.assigneeId ?? null,
          columnId: input.columnId,
          position: count + 1,
        },
      });
    },

    updateTask: async (
      _: unknown,
      args: { id: string; input: UpdateTaskInput },
      ctx: Context,
    ) => {
      const { id, input } = args;
      return ctx.prisma.task.update({
        where: { id },
        data: {
          ...(input.title !== undefined && input.title !== null ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.priority !== undefined && input.priority !== null
            ? { priority: input.priority }
            : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
          ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        },
      });
    },

    deleteTask: async (_: unknown, args: { id: string }, ctx: Context) => {
      await ctx.prisma.task.delete({ where: { id: args.id } });
      return args.id;
    },

    moveTask: async (_: unknown, args: { input: MoveTaskInput }, ctx: Context) => {
      const { taskId, toColumnId, toIndex } = args.input;
      // BUG #5: this updates only the moved task's position and never
      // renumbers its siblings. Positions collide ("3" already exists in
      // the destination column) and on next reload tasks come back in an
      // arbitrary stable-but-wrong order. See BUGS.md.
      return ctx.prisma.task.update({
        where: { id: taskId },
        data: {
          columnId: toColumnId,
          position: toIndex,
        },
      });
    },
  },
};
