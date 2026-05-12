import { prisma } from "./prisma.js";

export interface Context {
  prisma: typeof prisma;
}

export const buildContext = async (): Promise<Context> => ({
  prisma,
});
