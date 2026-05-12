import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.LOG_PRISMA === "1" ? ["query", "warn", "error"] : ["warn", "error"],
});
