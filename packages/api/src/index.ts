import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import express from "express";
import http from "node:http";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers/index.js";
import { buildContext, type Context } from "./context.js";

const PORT = Number(process.env.API_PORT ?? 4000);

async function start() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: true,
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({ origin: true, credentials: true }),
    express.json({ limit: "1mb" }),
    expressMiddleware(server, {
      context: async () => buildContext(),
    }),
  );

  app.get("/healthz", (_req, res) => {
    res.json({ status: "ok" });
  });

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  // eslint-disable-next-line no-console
  console.log(`🚀  API ready at http://localhost:${PORT}/graphql`);
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API:", err);
  process.exit(1);
});
