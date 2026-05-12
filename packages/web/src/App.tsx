import { useQuery } from "@apollo/client";
import { BOARD_QUERY } from "./graphql/operations.js";
import type { BoardQueryData } from "./types.js";
import { Board } from "./components/Board.js";

export function App() {
  const { data, loading, error } = useQuery<BoardQueryData>(BOARD_QUERY);

  if (loading && !data) {
    return <div className="state state--loading">Loading board…</div>;
  }
  if (error) {
    return (
      <div className="state state--error">
        <strong>Failed to load board.</strong>
        <pre>{error.message}</pre>
      </div>
    );
  }
  if (!data?.board) {
    return <div className="state">No board found. Did you run the seed?</div>;
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>{data.board.name}</h1>
        <p className="app__subtitle">
          Task Board · interview practice scaffold. See <code>BUGS.md</code> for
          the reported issues.
        </p>
      </header>
      <Board board={data.board} />
    </div>
  );
}
