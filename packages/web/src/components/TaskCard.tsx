import { useMutation } from "@apollo/client";
import classNames from "classnames";
import type { TaskNode } from "../types.js";
import { DELETE_TASK } from "../graphql/operations.js";

interface Props {
  task: TaskNode;
  columnId: string;
}

const PRIORITY_LABEL: Record<TaskNode["priority"], string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

function formatDueDate(iso: string): string {
  // BUG #4: the server returns dueDate as an ISO timestamp at 00:00 UTC.
  // `new Date(iso)` interprets that instant in the local timezone, so a
  // task due "2025-04-15" displays as "Apr 14" for anyone west of UTC.
  // Reproduce: set your system timezone to America/Los_Angeles, view a task
  // seeded with a due date, and watch the day shift back by one.
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function TaskCard({ task, columnId }: Props) {
  const [deleteTask, { loading: deleting }] = useMutation(DELETE_TASK, {
    variables: { id: task.id },
    update(cache) {
      cache.modify({
        id: cache.identify({ __typename: "Column", id: columnId }),
        fields: {
          tasks(existing: ReadonlyArray<{ __ref: string }> | undefined, { readField }) {
            const list = Array.isArray(existing) ? existing : [];
            return list.filter((ref) => readField("id", ref) !== task.id);
          },
          taskCount(existing: number | undefined) {
            return Math.max(0, (existing ?? 0) - 1);
          },
        },
      });
      cache.evict({ id: cache.identify({ __typename: "Task", id: task.id }) });
      cache.gc();
    },
  });

  return (
    <article className={classNames("task", `task--${task.priority.toLowerCase()}`)}>
      <header className="task__header">
        <h3 className="task__title">{task.title}</h3>
        <button
          type="button"
          className="task__delete"
          aria-label={`Delete ${task.title}`}
          disabled={deleting}
          onClick={() => {
            if (window.confirm(`Delete "${task.title}"?`)) {
              void deleteTask();
            }
          }}
        >
          ×
        </button>
      </header>
      {task.description ? <p className="task__desc">{task.description}</p> : null}
      <footer className="task__footer">
        <span className={classNames("task__priority", `task__priority--${task.priority.toLowerCase()}`)}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        {task.dueDate ? (
          <span className="task__due" title={task.dueDate}>
            Due {formatDueDate(task.dueDate)}
          </span>
        ) : null}
        {task.assignee ? (
          <span className="task__assignee" title={task.assignee.name}>
            {task.assignee.avatarUrl ? (
              <img src={task.assignee.avatarUrl} alt="" />
            ) : (
              task.assignee.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
            )}
          </span>
        ) : null}
      </footer>
    </article>
  );
}
