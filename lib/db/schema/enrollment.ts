import { sqliteTable, integer, text, unique } from 'drizzle-orm/sqlite-core';
import { students } from './student';
import { courses } from './course';

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
