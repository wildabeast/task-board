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
