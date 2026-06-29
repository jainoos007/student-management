import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').unique().notNull(),
  credits: integer('credits').notNull(),
  created_at: text('created_at').notNull(),
  deleted_at: text('deleted_at'),
});
