import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const graphqlUrl =
  (import.meta.env.VITE_GRAPHQL_URL as string | undefined) ??
  "http://localhost:4000/graphql";

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: graphqlUrl }),
  cache: new InMemoryCache({
    typePolicies: {
      Column: {
        // taskCount is treated as a simple scalar — see BUGS.md #1: it goes
        // stale after createTask/deleteTask because no cache update is
        // wired up for it.
        fields: {
          tasks: {
            merge(_existing, incoming: unknown[]) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
