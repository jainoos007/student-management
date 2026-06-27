import { getDb } from "./db";
import { Course } from "@/types/course";

type CourseUpdate = Pick<Course, "id" | "name" | "code" | "credits">;

export function getCourses(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const db = getDb();
  return db
    .prepare(
      `
        SELECT * FROM courses LIMIT ? OFFSET ?`,
    )
    .all(limit, offset) as Course[];
}

export function addCourses(course: Omit<Course, "id" | "created_at">) {
  const db = getDb();
  const created_at = new Date().toISOString();
  return db
    .prepare(
      `
    INSERT INTO courses (name, code, credits, created_at) VALUES (?,?,?,?)
    `,
    )
    .run(course.name, course.code, course.credits, created_at);
}

export function updateCourse(course: CourseUpdate) {
  const db = getDb();
  return db
    .prepare(
      `
        UPDATE courses SET name = ? , code = ? , credits = ? WHERE id = ?
        `,
    )
    .run(course.name, course.code, course.credits, course.id);
}

export function deleteCourse(id: number) {
  const db = getDb();
  return db.prepare(`DELETE FROM courses WHERE id = ?`).run(id);
}

export function getStudentCourses(studentId: number) {
  const db = getDb();
  return db
    .prepare(
      `
     SELECT c.*, e.id as enrollment_id FROM courses c
     JOIN enrollments e ON c.id = e.course_id
     WHERE e.student_id = ?   
    `,
    )
    .all(studentId) as (Course & { enrollment_id: number })[];
}

export function searchCourses(query: string): Course[] {
  const db = getDb();
  return db
    .prepare(
      `
        SELECT * FROM courses
        WHERE name LIKE ? OR code LIKE ? OR credits LIKE ?
        `,
    )
    .all(`%${query}%`, `%${query}%`, `%${query}%`) as Course[];
}

export function getTotalCourses(): number {
  const db = getDb();
  const result = db.prepare("SELECT COUNT(*) as count FROM courses").get() as {
    count: number;
  };
  return result.count;
}

export function getAverageEnrollmentsPerStudent(): number {
  const db = getDb();
  const totalStudents = (db.prepare("SELECT COUNT(*) as count FROM students").get() as { count: number }).count;
  if (totalStudents === 0) return 0;
  const totalEnrollments = (db.prepare("SELECT COUNT(*) as count FROM enrollments").get() as { count: number }).count;
  return totalEnrollments / totalStudents;
}

