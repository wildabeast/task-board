import React from "react";
import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "./apollo.js";
import { App } from "./App.js";
import "./styles.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Missing #root container");
}

createRoot(container).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
);
