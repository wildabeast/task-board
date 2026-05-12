import { useState } from "react";
import type { ColumnNode } from "../types.js";
import { TaskCard } from "./TaskCard.js";
import { NewTaskForm } from "./NewTaskForm.js";

interface Props {
  column: ColumnNode;
}

export function Column({ column }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="column">
      <header className="column__header">
        <h2 className="column__title">{column.name}</h2>
        {/*
          BUG #1: taskCount comes from the server's Column.taskCount resolver
          and is cached by Apollo. The createTask / deleteTask mutations
          don't tell Apollo to invalidate it, so this badge stays stale until
          a manual refresh. The actual list of tasks below DOES update
          (because the createTask mutation result includes the new Task and
          Apollo merges it), which makes the discrepancy especially
          confusing. Reproduce: add a task to a column, watch the badge stay
          on its original count.
        */}
        <span className="column__count" title="Number of tasks in this column">
          {column.taskCount}
        </span>
      </header>

      <div className="column__tasks">
        {column.tasks.map((task) => (
          <TaskCard key={task.id} task={task} columnId={column.id} />
        ))}
      </div>

      {showForm ? (
        <NewTaskForm
          columnId={column.id}
          onClose={() => setShowForm(false)}
        />
      ) : (
        <button
          type="button"
          className="column__add"
          onClick={() => setShowForm(true)}
        >
          + Add task
        </button>
      )}
    </section>
  );
}
