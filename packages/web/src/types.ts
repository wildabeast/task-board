export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface TaskNode {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  position: number;
  dueDate: string | null;
  assignee: UserSummary | null;
}

export interface ColumnNode {
  id: string;
  name: string;
  position: number;
  taskCount: number;
  tasks: TaskNode[];
}

export interface BoardNode {
  id: string;
  name: string;
  columns: ColumnNode[];
}

export interface BoardQueryData {
  board: BoardNode | null;
}

export interface UsersQueryData {
  users: UserSummary[];
}
