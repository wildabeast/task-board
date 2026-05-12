import { gql } from "@apollo/client";

export const BOARD_QUERY = gql`
  query Board {
    board {
      id
      name
      columns {
        id
        name
        position
        taskCount
        tasks {
          id
          title
          description
          priority
          position
          dueDate
          assignee {
            id
            name
            avatarUrl
          }
        }
      }
    }
  }
`;

export const USERS_QUERY = gql`
  query Users {
    users {
      id
      name
      avatarUrl
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      description
      priority
      dueDate
      position
      assignee {
        id
        name
        avatarUrl
      }
      column {
        id
      }
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      title
      description
      priority
      dueDate
      assignee {
        id
        name
        avatarUrl
      }
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const MOVE_TASK = gql`
  mutation MoveTask($input: MoveTaskInput!) {
    moveTask(input: $input) {
      id
      position
      column {
        id
      }
    }
  }
`;
