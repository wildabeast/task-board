import type { BoardNode } from "../types.js";
import { Column } from "./Column.js";

interface Props {
  board: BoardNode;
}

export function Board({ board }: Props) {
  return (
    <div className="board">
      {board.columns.map((col) => (
        <Column key={col.id} column={col} />
      ))}
    </div>
  );
}
