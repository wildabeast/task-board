import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime

  enum Priority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  type User {
    id: ID!
    name: String!
    email: String!
    avatarUrl: String
  }

  type Board {
    id: ID!
    name: String!
    columns: [Column!]!
  }

  type Column {
    id: ID!
    name: String!
    position: Int!
    tasks: [Task!]!
    taskCount: Int!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    position: Int!
    dueDate: DateTime
    priority: Priority!
    createdAt: DateTime!
    updatedAt: DateTime!
    assignee: User
    column: Column!
  }

  type Query {
    board(id: ID): Board
    users: [User!]!
  }

  input CreateTaskInput {
    columnId: ID!
    title: String!
    description: String
    priority: Priority
    dueDate: DateTime
    assigneeId: ID
  }

  input UpdateTaskInput {
    title: String
    description: String
    priority: Priority
    dueDate: DateTime
    assigneeId: ID
  }

  input MoveTaskInput {
    taskId: ID!
    toColumnId: ID!
    toIndex: Int!
  }

  type Mutation {
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): ID!
    moveTask(input: MoveTaskInput!): Task!
  }
`;
