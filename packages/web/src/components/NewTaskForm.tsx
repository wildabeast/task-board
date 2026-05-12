import { useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_TASK } from "../graphql/operations.js";
import type { Priority } from "../types.js";

interface Props {
  columnId: string;
  onClose: () => void;
}

const PRIORITY_OPTIONS: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function NewTaskForm({ columnId, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const [createTask, { loading, error }] = useMutation(CREATE_TASK, {
    // BUG #1 (continued): we only update the `tasks` list on the Column —
    // the server-resolved `taskCount` is never touched, so the badge in
    // Column.tsx shows the stale value. A correct fix would either evict
    // the count, write a new value, or refetch the board query.
    update(cache, { data }) {
      const created = data?.createTask;
      if (!created) return;
      cache.modify({
        id: cache.identify({ __typename: "Column", id: created.column.id }),
        fields: {
          tasks(existing) {
            const list = Array.isArray(existing)
              ? (existing as ReadonlyArray<{ __ref: string }>)
              : [];
            const newRef = cache.identify({ __typename: "Task", id: created.id });
            if (!newRef) return list;
            return [...list, { __ref: newRef }];
          },
          taskCount(existing: number) {
            return existing + 1;
          },
        },
      });
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    // BUG #4 (companion): we send the raw "YYYY-MM-DD" string from a
    // <input type="date"> as if it were a full ISO datetime. The server
    // parses it as midnight UTC, which combined with the local-tz display
    // in TaskCard.formatDueDate produces the off-by-one-day rendering.
    const dueIso = dueDate ? new Date(dueDate).toISOString() : null;

    await createTask({
      variables: {
        input: {
          columnId,
          title: trimmed,
          description: description.trim() || null,
          priority,
          dueDate: dueIso,
        },
      },
    });
    onClose();
  }

  return (
    <form className="new-task" onSubmit={handleSubmit}>
      <input
        autoFocus
        className="new-task__title"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="new-task__desc"
        placeholder="Description (optional)"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="new-task__row">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      {error ? <div className="new-task__error">{error.message}</div> : null}
      <div className="new-task__actions">
        <button type="button" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="submit" disabled={loading || !title.trim()}>
          {loading ? "Adding…" : "Add task"}
        </button>
      </div>
    </form>
  );
}
