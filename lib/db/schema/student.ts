import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const students = sqliteTable('students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  age: integer('age').notNull(),
  department: text('department').notNull(),
  created_at: text('created_at').notNull(),
  deleted_at: text('deleted_at'),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: integer('entity_id'),
  details: text('details').notNull(),
  created_at: text('created_at').notNull(),
});
