import { sqliteTable, integer, text, unique } from 'drizzle-orm/sqlite-core';

export const students = sqliteTable('students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  age: integer('age').notNull(),
  department: text('department').notNull(),
  created_at: text('created_at').notNull(),
  deleted_at: text('deleted_at'),
});

export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').unique().notNull(),
  credits: integer('credits').notNull(),
  created_at: text('created_at').notNull(),
  deleted_at: text('deleted_at'),
});

export const enrollments = sqliteTable('enrollments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  student_id: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  course_id: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  enrollment_date: text('enrollment_date').notNull(),
  deleted_at: text('deleted_at'),
  grade: text('grade'),
}, (t) => [
  unique().on(t.student_id, t.course_id)
]);

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: integer('entity_id'),
  details: text('details').notNull(),
  created_at: text('created_at').notNull(),
});
